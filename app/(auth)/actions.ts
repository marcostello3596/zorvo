"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Alta y acceso al Club — OTP de 6 dígitos por email (§3).
 *
 * Sin contraseñas: nadie quiere inventar una para un programa de fidelidad
 * de una cafetería, y una contraseña débil reutilizada es peor que ninguna.
 *
 * Sin magic link: el socio abre el mail en la computadora y el link lo
 * dejaría logueado ahí, no en el teléfono que va a usar en el mostrador.
 * Un código de 6 dígitos se transcribe entre dispositivos sin fricción.
 */

const emailSchema = z.string().trim().toLowerCase().email("Ese email no parece válido");
const nombreSchema = z.string().trim().min(1, "Necesitamos saber cómo llamarte").max(60);
const codigoSchema = z.string().trim().regex(/^\d{6}$/, "El código son 6 dígitos");

export type EstadoAuth = { error?: string };

/** Alta de socio nuevo. Crea el usuario si no existe. */
export async function altaSocio(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const nombre = nombreSchema.safeParse(formData.get("nombre"));
  if (!nombre.success) return { error: nombre.error.issues[0]?.message };

  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0]?.message };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: true,
      // Va a raw_user_meta_data, que es de donde lo lee el trigger
      // on_auth_user_created para armar el profile.
      data: { display_name: nombre.data },
    },
  });

  if (error) return { error: traducir(error.message) };

  redirect(`/verificar?email=${encodeURIComponent(email.data)}&nuevo=1`);
}

/** Acceso de socio existente. NO crea usuario. */
export async function ingresar(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0]?.message };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false },
  });

  if (error) return { error: traducir(error.message) };

  redirect(`/verificar?email=${encodeURIComponent(email.data)}`);
}

/** Verificación del código. Es lo que crea la sesión. */
export async function verificar(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Volvé a empezar: el email se perdió." };

  const codigo = codigoSchema.safeParse(formData.get("codigo"));
  if (!codigo.success) return { error: codigo.error.issues[0]?.message };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: codigo.data,
    type: "email",
  });

  if (error) return { error: traducir(error.message) };

  redirect("/club");
}

/**
 * Entrar con Google.
 *
 * Sirve igual para alta y para ingreso: si la cuenta no existe, Supabase la
 * crea y el trigger arma profile y membresía. Para el socio es un solo botón,
 * que es como tiene que ser — nadie quiere elegir entre "registrarse" e
 * "iniciar sesión" cuando es la misma acción.
 */
export async function conGoogle(): Promise<EstadoAuth> {
  const supabase = await createSupabaseServerClient();

  // El origin se lee del request y no de una env var: así funciona igual en
  // local, en preview de Vercel y en producción, sin configurar nada.
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/club`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return { error: "No pudimos abrir Google. Probá con tu email." };
  }

  redirect(data.url);
}

export async function salir() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Los mensajes de Supabase vienen en inglés y con vocabulario de auth.
 * El socio no tiene por qué leer "OTP" ni "signups not allowed".
 */
function traducir(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("signups not allowed") || m.includes("user not found")) {
    return "No encontramos ese email. ¿Querés sumarte al Club?";
  }
  if (m.includes("expired")) {
    return "El código venció. Pedí uno nuevo.";
  }
  if (m.includes("invalid") && m.includes("token")) {
    return "Ese código no es correcto. Fijate que sean los 6 dígitos del último mail.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Demasiados intentos seguidos. Esperá un minuto.";
  }
  return "Algo falló de nuestro lado. Probá de nuevo en un momento.";
}
