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
/**
 * La longitud del código la define Supabase (Authentication → Providers →
 * Email → Email OTP Length), y va de 6 a 10 según cómo esté el proyecto.
 * Fijarla acá en 6 hacía que un cambio de configuración del servidor rompiera
 * el login sin que nada en el código lo explicara.
 */
const codigoSchema = z
  .string()
  .trim()
  .regex(/^\d{4,10}$/, "El código son solo números, los del último mail");

export type EstadoAuth = { error?: string };

/** Solo rutas internas: evita que ?next= mande al socio a otro sitio. */
function destinoSeguro(valor: FormDataEntryValue | null, porDefecto = "/club"): string {
  const v = typeof valor === "string" ? valor : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : porDefecto;
}

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
  const next = destinoSeguro(formData.get("next"));

  // El primer dueño (ZORVO_OWNER_EMAILS) puede entrar directo a /admin sin
  // haberse dado de alta antes como socio. Para el resto, ingresar no crea
  // cuentas: eso es /join, o Equipo para el personal.
  const duenos = (process.env.ZORVO_OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const esDueno = next.startsWith("/admin") && duenos.includes(email.data);

  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: esDueno },
  });

  if (error) return { error: traducir(error.message) };

  redirect(`/verificar?email=${encodeURIComponent(email.data)}&next=${encodeURIComponent(next)}`);
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

  // Supabase usa un tipo de token distinto según qué plantilla disparó el
  // mail: "email" para el OTP de ingreso, "signup" para la confirmación de
  // alta de un usuario nuevo. Desde la pantalla son seis dígitos idénticos,
  // así que probamos los dos en vez de obligar al socio a saber cuál le tocó.
  const tipos = ["email", "signup"] as const;
  let ultimoError = "";

  for (const type of tipos) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.data,
      token: codigo.data,
      type,
    });

    if (!error) redirect(destinoSeguro(formData.get("next")));
    ultimoError = error.message;
  }

  return { error: traducir(ultimoError) };
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
 *
 * REGLA: el mensaje original NUNCA se descarta. Se registra siempre en el
 * servidor, y en desarrollo se muestra en pantalla. Tragarse el error real
 * para mostrar uno bonito deja a quien programa sin nada para investigar —
 * que es exactamente lo que pasó la primera vez que esto falló.
 */
function traducir(mensaje: string): string {
  console.error("[zorvo:auth]", mensaje);

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

  // El caso más común al configurar SMTP por primera vez. Supabase lo
  // reporta como error de envío sin decir por qué falló el servidor.
  if (
    m.includes("sending") ||
    m.includes("smtp") ||
    m.includes("email address") ||
    m.includes("confirmation email")
  ) {
    return dev(
      "No se pudo enviar el mail. Revisá SMTP Settings en Supabase: host smtp.gmail.com, puerto 587, y la contraseña de aplicación de 16 caracteres (no la de tu cuenta).",
      mensaje,
    );
  }

  return dev("Algo falló de nuestro lado. Probá de nuevo en un momento.", mensaje);
}

/** En desarrollo suma el error crudo; en producción no filtra nada. */
function dev(paraElSocio: string, original: string): string {
  return process.env.NODE_ENV === "production"
    ? paraElSocio
    : `${paraElSocio}\n\n[dev] ${original}`;
}
