import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Acceso a datos del Club.
 *
 * Todo pasa por el cliente con sesión, no por el admin: RLS ya garantiza que
 * un socio solo lee sus propias filas. Si alguna de estas consultas necesitara
 * service_role, sería señal de que falta una política, no de que falta una
 * excepción.
 *
 * Las funciones devuelven null cuando no hay socio en vez de tirar. Un
 * usuario logueado sin membresía es un estado raro pero posible (por ejemplo
 * si el trigger falló), y la pantalla tiene que poder decirlo sin romperse.
 */

export type SocioResumen = {
  memberId: string;
  nombre: string;
  memberCode: string;
  desde: string;
  lifetimePoints: number;
};

export type ProgresoRecorrido = {
  slug: string;
  nombre: string;
  resumen: string | null;
  premio: string | null;
  hechos: number;
  total: number;
  completadoEl: string | null;
};

export type CafeCarta = {
  id: string;
  nombre: string;
  familia: string;
  nota: string | null;
  probado: boolean;
};

/** El socio de la sesión actual. null si no hay sesión o no tiene membresía. */
export async function getSocio(): Promise<SocioResumen | null> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("members")
    .select("id, member_code, joined_at, lifetime_points, profiles(display_name)")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!data) return null;

  // profiles viene como objeto o array según cómo resuelva la relación.
  const perfil = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

  return {
    memberId: data.id,
    nombre: perfil?.display_name ?? user.email?.split("@")[0] ?? "Socio",
    memberCode: data.member_code,
    desde: new Date(data.joined_at).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    }),
    lifetimePoints: data.lifetime_points,
  };
}

/** Los recorridos activos con el progreso del socio. */
export async function getRecorridos(memberId: string): Promise<ProgresoRecorrido[]> {
  const supabase = await createSupabaseServerClient();

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, slug, name, description, sort_order, rewards(name)")
    .eq("active", true)
    .order("sort_order");

  if (!challenges?.length) return [];

  const [{ data: progreso }, { data: tamanos }] = await Promise.all([
    supabase
      .from("challenge_progress")
      .select("challenge_id, progress_num, progress_den, completed_at")
      .eq("member_id", memberId),
    // Un socio recién dado de alta todavía no tiene fila de progreso: sin
    // esta vista mostraríamos "0 de 0" en su primera pantalla.
    supabase.from("v_challenge_sizes").select("challenge_id, total"),
  ]);

  const porChallenge = new Map(
    (progreso ?? []).map((p) => [p.challenge_id, p]),
  );
  const porTamano = new Map(
    (tamanos ?? []).map((t) => [t.challenge_id, t.total]),
  );

  return challenges.map((c) => {
    const p = porChallenge.get(c.id);
    const premio = Array.isArray(c.rewards) ? c.rewards[0] : c.rewards;
    return {
      slug: c.slug,
      nombre: c.name,
      resumen: c.description,
      premio: premio?.name ?? null,
      hechos: p?.progress_num ?? 0,
      total: p?.progress_den ?? porTamano.get(c.id) ?? 0,
      completadoEl: p?.completed_at ?? null,
    };
  });
}

/** La carta con qué probó el socio y qué le falta. */
export async function getCarta(memberId: string): Promise<CafeCarta[]> {
  const supabase = await createSupabaseServerClient();

  const { data: productos } = await supabase
    .from("products")
    .select("id, name, description, sort_order, product_categories(name)")
    .eq("active", true)
    .eq("counts_for_collection", true)
    .order("sort_order");

  if (!productos?.length) return [];

  const { data: consumos } = await supabase
    .from("consumptions")
    .select("product_id")
    .eq("member_id", memberId)
    .is("voided_at", null);

  const probados = new Set((consumos ?? []).map((c) => c.product_id));

  return productos.map((p) => {
    const cat = Array.isArray(p.product_categories)
      ? p.product_categories[0]
      : p.product_categories;
    return {
      id: p.id,
      nombre: p.name,
      familia: cat?.name ?? "",
      nota: p.description,
      probado: probados.has(p.id),
    };
  });
}

/** Los tres números de la home: cafés totales, de la carta, y del mes. */
export async function getEstadisticas(memberId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("consumptions")
    .select("product_id, quantity, occurred_at")
    .eq("member_id", memberId)
    .is("voided_at", null);

  const consumos = data ?? [];

  // El primer día del mes en hora de Buenos Aires, no en UTC: si son las 22h
  // del 31 acá, en UTC ya es el mes siguiente y el número saldría mal.
  const ahora = new Date();
  const inicioMes = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }),
  );
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  return {
    cafesTotales: consumos.reduce((n, c) => n + (c.quantity ?? 1), 0),
    deLaCarta: new Set(consumos.map((c) => c.product_id)).size,
    esteMes: consumos.filter((c) => new Date(c.occurred_at) >= inicioMes).length,
    ahora,
  };
}

/** "Lo de siempre": el producto más repetido en los últimos 90 días. */
export async function getLoDeSiempre(memberId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const hace90 = new Date();
  hace90.setDate(hace90.getDate() - 90);

  const { data } = await supabase
    .from("consumptions")
    .select("products(name)")
    .eq("member_id", memberId)
    .is("voided_at", null)
    .gte("occurred_at", hace90.toISOString());

  if (!data?.length) return null;

  const cuenta = new Map<string, number>();
  for (const fila of data) {
    const p = Array.isArray(fila.products) ? fila.products[0] : fila.products;
    if (!p?.name) continue;
    cuenta.set(p.name, (cuenta.get(p.name) ?? 0) + 1);
  }

  let mejor: string | null = null;
  let max = 0;
  for (const [nombre, n] of cuenta) {
    if (n > max) {
      max = n;
      mejor = nombre;
    }
  }
  // Con un solo consumo no hay "siempre". Dos es el mínimo para un hábito.
  return max >= 2 ? mejor : null;
}
