"use client";

import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Cliente del navegador. Solo anon key, siempre bajo RLS.
 *
 * Se memoiza porque createBrowserClient abre un canal de realtime y crear
 * uno por render dejaría conexiones colgadas.
 */
let cached: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  cached ??= createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return cached;
}
