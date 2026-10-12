import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Quién está del otro lado del mostrador.
 *
 * La tabla staff es la fuente de verdad: si alguien no tiene una fila activa
 * ahí, no opera, aunque su JWT diga otra cosa. Se lee con service_role
 * porque las políticas de staff dependen del claim app_role, que todavía no
 * existe cuando se da de alta al primer dueño.
 *
 * PRIMER DUEÑO: no hay nadie que pueda dar de alta al primero. Los emails de
 * ZORVO_OWNER_EMAILS (variable de entorno del servidor, separados por coma)
 * se convierten en owner la primera vez que entran a /admin. Después, el
 * equipo se maneja desde /admin/equipo.
 */

export type Rol = "barista" | "manager" | "owner";

export type Staff = {
  staffId: string;
  profileId: string;
  email: string;
  nombre: string;
  rol: Rol;
  locationId: string;
  local: string;
};

const NIVEL: Record<Rol, number> = { barista: 1, manager: 2, owner: 3 };
export const puede = (s: Pick<Staff, "rol">, minimo: Rol) => NIVEL[s.rol] >= NIVEL[minimo];

function emailsDueno(): string[] {
  return (process.env.ZORVO_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** El local por defecto: el primero activo. Si la base está vacía, lo crea. */
export async function localPorDefecto(): Promise<{ id: string; name: string }> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("locations").select("id, name").eq("active", true).order("created_at").limit(1).maybeSingle();
  if (data) return data;
  const { data: nuevo, error } = await admin.from("locations").insert({ slug: "zorvo", name: "ZORVO" }).select("id, name").single();
  if (error || !nuevo) throw new Error(`No se pudo crear el local: ${error?.message}`);
  return nuevo;
}

/** Deja el rol también en el JWT (app_metadata), que es lo que miran las políticas RLS. */
export async function sincronizarRol(userId: string, rol: Rol | "customer", locationId: string | null) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = { ...(data.user?.app_metadata ?? {}), app_role: rol, location_id: locationId };
  await admin.auth.admin.updateUserById(userId, { app_metadata: meta });
}

export const getStaff = cache(async function getStaff(): Promise<Staff | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const leer = () =>
    admin
      .from("staff")
      .select("id, role, location_id, locations(name), profiles(display_name, email)")
      .eq("profile_id", user.id)
      .eq("active", true)
      .order("hired_at")
      .limit(1)
      .maybeSingle();

  let { data: fila } = await leer();

  if (!fila && user.email && emailsDueno().includes(user.email.toLowerCase())) {
    const local = await localPorDefecto();
    await admin.from("staff").upsert(
      { profile_id: user.id, role: "owner", location_id: local.id, active: true },
      { onConflict: "profile_id,location_id" },
    );
    await sincronizarRol(user.id, "owner", local.id);
    ({ data: fila } = await leer());
  }

  if (!fila || fila.role === "customer") return null;

  let locationId = fila.location_id;
  let local = (Array.isArray(fila.locations) ? fila.locations[0] : fila.locations)?.name ?? "";
  if (!locationId) {
    const l = await localPorDefecto();
    locationId = l.id;
    local = l.name;
  }
  const perfil = Array.isArray(fila.profiles) ? fila.profiles[0] : fila.profiles;

  return {
    staffId: fila.id,
    profileId: user.id,
    email: user.email ?? perfil?.email ?? "",
    nombre: perfil?.display_name ?? user.email?.split("@")[0] ?? "Equipo",
    rol: fila.role as Rol,
    locationId,
    local,
  };
});

/** Para server actions y páginas: corta si no es staff (o no le alcanza el rol). */
export async function requireStaff(minimo: Rol = "barista"): Promise<Staff> {
  const s = await getStaff();
  if (!s) redirect("/admin");
  if (!puede(s, minimo)) redirect("/admin");
  return s;
}
