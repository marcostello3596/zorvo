import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Vuelta de Google. Acá el código de autorización se cambia por una sesión.
 *
 * Es Route Handler y no página porque necesita escribir cookies, cosa que un
 * Server Component no puede hacer.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/club";

  // El proveedor puede volver con un error si la persona canceló en la
  // pantalla de Google. No es una falla nuestra ni hay nada que reportar.
  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${origin}/ingresar?cancelado=1`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/ingresar?error=sin-codigo`);
  }

  const supabase = await createSupabaseServerClient();
  const { error: intercambio } = await supabase.auth.exchangeCodeForSession(code);

  if (intercambio) {
    return NextResponse.redirect(`${origin}/ingresar?error=sesion`);
  }

  // next viene de nuestra propia URL, pero igual se valida: si alguien lo
  // manipula a otro dominio, esto sería un redirect abierto.
  const destino = next.startsWith("/") ? next : "/club";
  return NextResponse.redirect(`${origin}${destino}`);
}
