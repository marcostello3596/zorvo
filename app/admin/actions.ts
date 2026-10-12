"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buscarSocios, getActividad, getFicha, type Actividad, type Ficha, type SocioEncontrado } from "@/lib/admin-queries";
import { byteaABase64 } from "@/lib/bytea";
import { parsearToken, verificarToken } from "@/lib/credential";
import { localPorDefecto, puede, requireStaff, sincronizarRol, type Rol } from "@/lib/staff";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { firmarTicket, leerTicket } from "@/lib/ticket";

/**
 * Acciones del mostrador. Todas empiezan con requireStaff(): el navegador del
 * barista nunca decide quién es el socio ni quién está atendiendo.
 */

export type Identificado = { ok: true; ficha: Ficha; ticket: string; manual: boolean } | { ok: false; msg: string };

const MSG = {
  noEsZorvo: "Ese QR no es de ZORVO. Pedile al cliente que abra su tarjeta en zorvo.",
  vencido: "El código venció. Que lo muestre de nuevo: se renueva cada 30 segundos.",
  invalido: "El código no coincide. Que cierre y vuelva a abrir su QR.",
  usado: "Ese código ya se usó. Esperá a que se renueve (30 s) y escaneá otra vez.",
  noSocio: "No encontramos a ese socio.",
  pausado: "Esta tarjeta está pausada. Hablá con el encargado.",
  vencioTicket: "Pasó demasiado tiempo. Volvé a escanear el QR.",
} as const;

async function registrarEscaneo(memberId: string | null, staffId: string, locationId: string, step: number | null, result: "expired" | "invalid" | "unknown" | "replay") {
  const admin = createSupabaseAdminClient();
  await admin.from("scan_events").insert({ member_id: memberId, staff_id: staffId, location_id: locationId, kind: "rotating", token_step: step, result });
}

/** El barista escaneó un QR. */
export async function identificar(token: string): Promise<Identificado> {
  const staff = await requireStaff();
  const parseado = parsearToken(String(token ?? ""));
  if (!parseado) return { ok: false, msg: MSG.noEsZorvo };

  const admin = createSupabaseAdminClient();
  const { data: socio } = await admin.from("members").select("id, status").eq("member_code", parseado.memberCode).maybeSingle();
  if (!socio) {
    await registrarEscaneo(null, staff.staffId, staff.locationId, parseado.paso, "unknown");
    return { ok: false, msg: MSG.noSocio };
  }
  if (socio.status !== "active") return { ok: false, msg: MSG.pausado };

  const { data: cred } = await admin
    .from("credentials")
    .select("secret_enc")
    .eq("member_id", socio.id)
    .eq("kind", "rotating")
    .is("revoked_at", null)
    .maybeSingle();
  if (!cred?.secret_enc) {
    await registrarEscaneo(socio.id, staff.staffId, staff.locationId, parseado.paso, "invalid");
    return { ok: false, msg: MSG.invalido };
  }

  const v = await verificarToken(token, byteaABase64(cred.secret_enc));
  if (!v.ok) {
    await registrarEscaneo(socio.id, staff.staffId, staff.locationId, parseado.paso, v.motivo);
    return { ok: false, msg: v.motivo === "expired" ? MSG.vencido : MSG.invalido };
  }

  // Aviso temprano de captura reusada. La garantía real está en la transacción.
  const { count } = await admin
    .from("scan_events")
    .select("id", { count: "exact", head: true })
    .eq("member_id", socio.id)
    .eq("kind", "rotating")
    .eq("token_step", v.paso)
    .eq("result", "ok");
  if (count) return { ok: false, msg: MSG.usado };

  const ficha = await getFicha(socio.id);
  if (!ficha) return { ok: false, msg: MSG.noSocio };
  return { ok: true, ficha, ticket: firmarTicket({ m: socio.id, st: staff.staffId, k: "rotating", s: v.paso }), manual: false };
}

/** El barista buscó al socio a mano (sin QR). Queda registrado como manual. */
export async function abrirManual(memberId: string): Promise<Identificado> {
  const staff = await requireStaff();
  if (!z.string().uuid().safeParse(memberId).success) return { ok: false, msg: MSG.noSocio };
  const ficha = await getFicha(memberId);
  if (!ficha) return { ok: false, msg: MSG.noSocio };
  if (ficha.estado !== "active") return { ok: false, msg: MSG.pausado };
  return { ok: true, ficha, ticket: firmarTicket({ m: memberId, st: staff.staffId, k: null, s: null }), manual: true };
}

export async function buscar(q: string): Promise<SocioEncontrado[]> {
  await requireStaff();
  return buscarSocios(String(q ?? "").slice(0, 80), 8);
}

const itemsSchema = z
  .array(z.object({ productId: z.string().uuid(), cantidad: z.number().int().min(1).max(20) }))
  .min(1)
  .max(20);

export type ResultadoSuma =
  | { ok: true; sumadas: number; ficha: Ficha; completo: boolean }
  | { ok: false; msg: string };

/** Suma la visita: un escaneo (con anti-replay) y sus consumos, en una transacción. */
export async function sumar(ticket: string, items: { productId: string; cantidad: number }[]): Promise<ResultadoSuma> {
  const staff = await requireStaff();
  const t = leerTicket(String(ticket ?? ""), staff.staffId);
  if (!t) return { ok: false, msg: MSG.vencioTicket };
  const parsed = itemsSchema.safeParse(items);
  if (!parsed.success) return { ok: false, msg: "Elegí al menos un producto." };

  const antes = await getFicha(t.m);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("zorvo_register_visit", {
    p_member_id: t.m,
    p_staff_id: staff.staffId,
    p_location_id: staff.locationId,
    p_kind: t.k,
    p_token_step: t.s,
    p_items: parsed.data.map((i) => ({ product_id: i.productId, quantity: i.cantidad })),
  });
  if (error) {
    console.error("[zorvo:mostrador] register_visit", error);
    return { ok: false, msg: "No se pudo sumar. Probá de nuevo." };
  }
  const r = data as { ok: boolean; added?: number; reason?: string };
  if (!r.ok) {
    return { ok: false, msg: r.reason === "replay" ? MSG.usado : r.reason === "member" ? MSG.pausado : "Elegí al menos un producto." };
  }
  const ficha = await getFicha(t.m);
  revalidatePath("/admin");
  return {
    ok: true,
    sumadas: ficha && antes ? ficha.total - antes.total : (r.added ?? 0),
    ficha: ficha!,
    completo: !!ficha && !!antes && ficha.tarjetas > antes.tarjetas,
  };
}

export type ResultadoCanje = { ok: true; ficha: Ficha } | { ok: false; msg: string };

export async function canjear(grantId: string, memberId: string): Promise<ResultadoCanje> {
  const staff = await requireStaff();
  const admin = createSupabaseAdminClient();
  const { data: grant } = await admin.from("reward_grants").select("id, member_id, status").eq("id", grantId).maybeSingle();
  if (!grant || grant.member_id !== memberId) return { ok: false, msg: "Ese premio no es de este socio." };

  const { data, error } = await admin.rpc("zorvo_redeem_grant", { p_grant_id: grantId, p_staff_id: staff.staffId });
  if (error) {
    console.error("[zorvo:mostrador] redeem_grant", error);
    return { ok: false, msg: "No se pudo canjear. Probá de nuevo." };
  }
  if (!(data as { ok: boolean }).ok) return { ok: false, msg: "Ese premio ya se canjeó." };
  const ficha = await getFicha(memberId);
  revalidatePath("/admin");
  revalidatePath(`/admin/clientes/${memberId}`);
  return { ok: true, ficha: ficha! };
}

/**
 * Anular un consumo cargado por error. El barista puede anular lo suyo de
 * los últimos 30 minutos; encargado y dueño, cualquier cosa. Nunca se borra:
 * queda la fila con quién y por qué.
 */
export async function anular(consumoId: string, motivo = "Cargado por error"): Promise<{ ok: boolean; msg?: string }> {
  const staff = await requireStaff();
  const admin = createSupabaseAdminClient();
  const { data: c } = await admin.from("consumptions").select("id, staff_id, created_at, voided_at, member_id").eq("id", consumoId).maybeSingle();
  if (!c) return { ok: false, msg: "No encontramos ese movimiento." };
  if (c.voided_at) return { ok: true };
  const reciente = Date.now() - new Date(c.created_at).getTime() < 30 * 60 * 1000;
  if (!puede(staff, "manager") && !(c.staff_id === staff.staffId && reciente)) {
    return { ok: false, msg: "Solo podés anular lo que cargaste vos en los últimos 30 minutos. Pedíselo al encargado." };
  }
  const { error } = await admin
    .from("consumptions")
    .update({ voided_at: new Date().toISOString(), voided_by: staff.staffId, void_reason: String(motivo).slice(0, 200) })
    .eq("id", consumoId)
    .is("voided_at", null);
  if (error) {
    console.error("[zorvo:mostrador] anular", error);
    return { ok: false, msg: "No se pudo anular." };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/clientes/${c.member_id}`);
  return { ok: true };
}

export async function actividad(): Promise<Actividad[]> {
  const staff = await requireStaff();
  return getActividad(staff.locationId);
}

// ───────────────────────────────────────────────────────────────────────────
// Equipo
// ───────────────────────────────────────────────────────────────────────────

export type EstadoEquipo = { ok?: boolean; msg?: string };

const altaSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ese email no parece válido"),
  nombre: z.string().trim().max(60).optional(),
  rol: z.enum(["barista", "manager"]),
});

/**
 * Sumar a alguien al equipo. Si nunca entró a ZORVO, se le crea la cuenta
 * (sin contraseña: entra con el código por mail, como cualquier socio).
 * Un encargado suma baristas; el dueño, también encargados.
 */
export async function agregarStaff(_prev: EstadoEquipo, form: FormData): Promise<EstadoEquipo> {
  const yo = await requireStaff("manager");
  const p = altaSchema.safeParse({
    email: form.get("email"),
    nombre: form.get("nombre") || undefined,
    rol: form.get("rol"),
  });
  if (!p.success) return { msg: p.error.issues[0]?.message };
  if (p.data.rol === "manager" && !puede(yo, "owner")) return { msg: "Solo el dueño puede sumar encargados." };

  const admin = createSupabaseAdminClient();
  const { data: perfil } = await admin.from("profiles").select("id").eq("email", p.data.email).maybeSingle();
  let userId = perfil?.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: p.data.email,
      email_confirm: true,
      user_metadata: { display_name: p.data.nombre || p.data.email.split("@")[0] },
    });
    if (error || !data.user) return { msg: `No se pudo crear la cuenta: ${error?.message ?? "error desconocido"}` };
    userId = data.user.id;
  }

  const locationId = yo.locationId || (await localPorDefecto()).id;
  const { data: existente } = await admin.from("staff").select("id, role").eq("profile_id", userId).eq("location_id", locationId).maybeSingle();
  if (existente && existente.role === "owner") return { msg: "Esa persona ya es dueña." };
  const { error } = await admin
    .from("staff")
    .upsert({ profile_id: userId, location_id: locationId, role: p.data.rol, active: true }, { onConflict: "profile_id,location_id" });
  if (error) return { msg: `No se pudo guardar: ${error.message}` };
  await sincronizarRol(userId, p.data.rol, locationId);
  revalidatePath("/admin/equipo");
  return { ok: true, msg: `Listo: ${p.data.email} ya puede entrar a /admin con el código que le llega por mail.` };
}

export async function cambiarEstadoStaff(staffId: string, activo: boolean): Promise<EstadoEquipo> {
  const yo = await requireStaff("manager");
  const admin = createSupabaseAdminClient();
  const { data: s } = await admin.from("staff").select("id, profile_id, role, location_id").eq("id", staffId).maybeSingle();
  if (!s) return { msg: "No encontramos a esa persona." };
  if (s.id === yo.staffId) return { msg: "No te podés dar de baja a vos mismo." };
  const rol = s.role as Rol;
  if (rol === "owner" || (rol === "manager" && !puede(yo, "owner"))) return { msg: "No tenés permiso para cambiar a esta persona." };
  await admin.from("staff").update({ active: activo }).eq("id", staffId);
  await sincronizarRol(s.profile_id, activo ? rol : "customer", activo ? s.location_id : null);
  revalidatePath("/admin/equipo");
  return { ok: true };
}
