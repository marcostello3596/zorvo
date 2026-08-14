import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { clientEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Respeta RLS: actúa como el usuario logueado.
 *
 * En Next 15+ cookies() es async, por eso esta función lo es.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Los Server Components no pueden escribir cookies. El refresh de
            // sesión lo hace el middleware; acá se ignora sin drama.
          }
        },
      },
    },
  );
}

/**
 * Cliente administrativo. IGNORA RLS.
 *
 * Solo para: registrar consumos desde el escáner, backfill de fidelidad,
 * entrega de recompensas y jobs de cron. Cada uso tiene que poder justificar
 * por qué la política de RLS no alcanzaba.
 *
 * Nunca se expone a un Client Component. El "server-only" de arriba hace que
 * el build falle si alguien lo intenta.
 */
export function createSupabaseAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
