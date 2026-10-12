"use server";

import { byteaABase64 } from "@/lib/bytea";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Entrega del secreto de credencial (§6).
 *
 * El secreto se entrega UNA SOLA VEZ por dispositivo, sobre TLS, y queda
 * guardado en el navegador del socio. A partir de ahí el código se genera
 * localmente cada 30 segundos, sin red — que es lo que hace que la credencial
 * funcione en el subte o con el teléfono en modo avión.
 *
 * Usa el cliente admin a propósito: RLS bloquea `credentials` para todos los
 * roles, incluido el dueño de la fila. Un socio no tiene por qué poder leer
 * su secreto por la API pública; solo lo recibe por este canal, después de
 * probar que tiene sesión.
 */

export type ResultadoCredencial =
  | { ok: true; memberCode: string; secreto: string }
  | { ok: false; error: string };

export async function obtenerSecretoCredencial(): Promise<ResultadoCredencial> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Necesitás iniciar sesión." };

  // El socio se resuelve desde la sesión, nunca desde un parámetro: si el
  // member_id viniera del cliente, cualquiera pediría el secreto de otro.
  const { data: socio } = await supabase
    .from("members")
    .select("id, member_code, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!socio) return { ok: false, error: "No encontramos tu membresía." };
  if (socio.status !== "active") {
    return { ok: false, error: "Tu membresía no está activa." };
  }

  const admin = createSupabaseAdminClient();

  const { data: existente } = await admin
    .from("credentials")
    .select("secret_enc")
    .eq("member_id", socio.id)
    .eq("kind", "rotating")
    .is("revoked_at", null)
    .maybeSingle();

  if (existente?.secret_enc) {
    return {
      ok: true,
      memberCode: socio.member_code,
      secreto: byteaABase64(existente.secret_enc),
    };
  }

  // Primera vez en cualquier dispositivo: se emite el secreto.
  const secreto = crypto.getRandomValues(new Uint8Array(32));
  const secretoB64 = btoa(String.fromCharCode(...secreto));

  const { error } = await admin.from("credentials").insert({
    member_id: socio.id,
    kind: "rotating",
    // Postgres recibe bytea en formato hex con prefijo \x.
    secret_enc: "\\x" + [...secreto].map((b) => b.toString(16).padStart(2, "0")).join(""),
  });

  if (error) {
    // Carrera: dos pestañas pidiendo el secreto a la vez. El índice único
    // credentials_one_active rechaza la segunda; leemos la que ganó.
    const { data: reintento } = await admin
      .from("credentials")
      .select("secret_enc")
      .eq("member_id", socio.id)
      .eq("kind", "rotating")
      .is("revoked_at", null)
      .maybeSingle();

    if (reintento?.secret_enc) {
      return {
        ok: true,
        memberCode: socio.member_code,
        secreto: byteaABase64(reintento.secret_enc),
      };
    }
    return { ok: false, error: "No se pudo emitir tu credencial." };
  }

  return { ok: true, memberCode: socio.member_code, secreto: secretoB64 };
}
