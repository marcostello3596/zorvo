import "server-only";

import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Lecturas del mostrador. Usan service_role: el barista ve datos de muchos
 * socios, y las políticas de RLS están pensadas para que cada socio vea solo
 * lo suyo. Cada función de acá se llama DESPUÉS de requireStaff().
 */

export type Ficha = {
  memberId: string;
  code: string;
  nombre: string;
  email: string;
  estado: "active" | "paused" | "blocked";
  desde: string;
  z: number;
  target: number;
  tarjetas: number;
  total: number;
  premios: { id: string; nombre: string; desde: string }[];
  ultimaVisita: string | null;
};

export type Producto = {
  id: string;
  nombre: string;
  familia: string;
  sumaZ: boolean;
};

export type Actividad = {
  id: string;
  fecha: string;
  socio: string;
  memberId: string;
  producto: string;
  cantidad: number;
  anulado: boolean;
  staffId: string | null;
  manual: boolean;
};

const uno = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

const punch = cache(async () => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("challenges")
    .select("id, config")
    .eq("kind", "PUNCH")
    .eq("active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id, target: Number((data.config as { target?: number } | null)?.target ?? 10) } : null;
});

export async function getFicha(memberId: string): Promise<Ficha | null> {
  const admin = createSupabaseAdminClient();
  const ch = await punch();
  const [{ data: m }, { data: progreso }, { data: premios }, { data: ultima }] = await Promise.all([
    admin
      .from("members")
      .select("id, member_code, status, joined_at, profiles(display_name, email)")
      .eq("id", memberId)
      .maybeSingle(),
    ch
      ? admin
          .from("challenge_progress")
          .select("progress_num, progress_den, state")
          .eq("member_id", memberId)
          .eq("challenge_id", ch.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("reward_grants")
      .select("id, granted_at, rewards(name)")
      .eq("member_id", memberId)
      .eq("status", "unlocked")
      .order("granted_at"),
    admin
      .from("consumptions")
      .select("occurred_at")
      .eq("member_id", memberId)
      .is("voided_at", null)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!m) return null;
  const perfil = uno(m.profiles);
  const state = (progreso?.state ?? {}) as { total?: number; cards?: number };
  return {
    memberId: m.id,
    code: m.member_code,
    nombre: perfil?.display_name || perfil?.email?.split("@")[0] || "Socio",
    email: perfil?.email ?? "",
    estado: m.status,
    desde: m.joined_at,
    z: progreso?.progress_num ?? 0,
    target: progreso?.progress_den || ch?.target || 10,
    tarjetas: state.cards ?? 0,
    total: state.total ?? 0,
    premios: (premios ?? []).map((g) => ({ id: g.id, nombre: uno(g.rewards)?.name ?? "Premio", desde: g.granted_at })),
    ultimaVisita: ultima?.occurred_at ?? null,
  };
}

export const getProductos = cache(async function getProductos(): Promise<Producto[]> {
  const admin = createSupabaseAdminClient();
  const ch = await punch();
  const [{ data: productos }, cuentan] = await Promise.all([
    admin
      .from("products")
      .select("id, name, sort_order, counts_for_collection, product_categories(name, sort_order)")
      .eq("active", true)
      .order("sort_order"),
    // Qué productos suman Z lo decide la config del desafío, igual que el motor.
    ch
      ? admin.from("challenges").select("config").eq("id", ch.id).single().then(({ data }) => (data?.config ?? {}) as { product_ids?: string[]; category_id?: string })
      : Promise.resolve(null),
  ]);
  return (productos ?? []).map((p) => {
    const cat = uno(p.product_categories);
    let sumaZ = p.counts_for_collection;
    if (cuentan?.product_ids) sumaZ = cuentan.product_ids.includes(p.id);
    return { id: p.id, nombre: p.name, familia: cat?.name ?? "Otros", sumaZ };
  });
});

/** Los últimos movimientos del local, para corregir un error al toque. */
export async function getActividad(locationId: string, limite = 12): Promise<Actividad[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("consumptions")
    .select("id, occurred_at, quantity, voided_at, staff_id, source, member_id, products(name), members(profiles(display_name, email))")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .limit(limite);
  return (data ?? []).map((c) => {
    const perfil = uno(uno(c.members)?.profiles);
    return {
      id: c.id,
      fecha: c.occurred_at,
      socio: perfil?.display_name || perfil?.email?.split("@")[0] || "Socio",
      memberId: c.member_id,
      producto: uno(c.products)?.name ?? "Producto",
      cantidad: c.quantity,
      anulado: !!c.voided_at,
      staffId: c.staff_id,
      manual: c.source === "manual",
    };
  });
}

export type SocioEncontrado = { memberId: string; code: string; nombre: string; email: string };

/** Por código (con o sin espacio), por email o por nombre. */
export async function buscarSocios(q: string, limite = 20): Promise<SocioEncontrado[]> {
  const admin = createSupabaseAdminClient();
  const texto = q.trim();
  if (texto.length < 2) return [];
  const code = texto.replace(/[\s-]/g, "").toUpperCase();

  if (/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(code)) {
    const { data } = await admin.from("members").select("id, member_code, profiles(display_name, email)").eq("member_code", code).limit(1);
    if (data?.length) return data.map(aSocio);
  }

  // PostgREST: los comodines de ilike van con * en .or(); se escapan los separadores.
  const limpio = texto.replace(/[,()*%]/g, " ").trim();
  const { data: perfiles } = await admin
    .from("profiles")
    .select("id")
    .or(`email.ilike.*${limpio}*,display_name.ilike.*${limpio}*`)
    .limit(limite);
  const ids = (perfiles ?? []).map((p) => p.id);
  if (!ids.length) return [];
  const { data } = await admin.from("members").select("id, member_code, profiles(display_name, email)").in("profile_id", ids).limit(limite);
  return (data ?? []).map(aSocio);
}

function aSocio(m: { id: string; member_code: string; profiles: unknown }): SocioEncontrado {
  const p = uno(m.profiles as { display_name: string | null; email: string | null } | null);
  return { memberId: m.id, code: m.member_code, nombre: p?.display_name || p?.email?.split("@")[0] || "Socio", email: p?.email ?? "" };
}

export async function getHistorialSocio(memberId: string, limite = 40): Promise<Actividad[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("consumptions")
    .select("id, occurred_at, quantity, voided_at, staff_id, source, member_id, products(name)")
    .eq("member_id", memberId)
    .order("occurred_at", { ascending: false })
    .limit(limite);
  return (data ?? []).map((c) => ({
    id: c.id,
    fecha: c.occurred_at,
    socio: "",
    memberId: c.member_id,
    producto: uno(c.products)?.name ?? "Producto",
    cantidad: c.quantity,
    anulado: !!c.voided_at,
    staffId: c.staff_id,
    manual: c.source === "manual",
  }));
}

export type MiembroEquipo = { staffId: string; nombre: string; email: string; rol: string; activo: boolean; desde: string };

export async function getEquipo(): Promise<MiembroEquipo[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("staff")
    .select("id, role, active, hired_at, profiles(display_name, email)")
    .order("active", { ascending: false })
    .order("hired_at");
  return (data ?? []).map((s) => {
    const p = uno(s.profiles);
    return { staffId: s.id, nombre: p?.display_name || p?.email?.split("@")[0] || "—", email: p?.email ?? "", rol: s.role, activo: s.active, desde: s.hired_at };
  });
}
