"use server";

import { redirect } from "next/navigation";

import { clientEnv } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * ⚠️ ACCESO DE PRUEBA — SOLO DESARROLLO
 *
 * Entra como un socio ficticio sin mandar un solo mail. Existe para poder
 * construir el resto del producto sin depender de SMTP ni de Google.
 *
 * POR QUÉ NO ALCANZA CON "ACORDARSE DE BORRARLO"
 *
 * Un bypass de login en producción deja entrar a cualquiera como cualquiera.
 * No es un bug menor: es la puerta de calle abierta. Por eso hay dos cerrojos
 * independientes, y el primero no depende de que nadie recuerde nada:
 *
 *   1. NODE_ENV tiene que ser "development". Vercel, Netlify y `next build`
 *      lo ponen en "production" solos. Si esto se despliega, la función tira
 *      excepción antes de tocar la base.
 *   2. ZORVO_DEV_LOGIN tiene que valer "1". Es un opt-in explícito para que
 *      no se active por accidente en la máquina de otra persona.
 *
 * Cuando tengas SMTP o Google andando, borrá este archivo y el botón que lo
 * llama. Mientras tanto, no puede hacer daño donde importa.
 */

const EMAIL_PRUEBA = "socio.prueba@zorvo.test";
const NOMBRE_PRUEBA = "Socio de Prueba";

function verificarQueEsDesarrollo() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "El acceso de prueba no existe en producción. Si ves esto en un servidor real, borrá app/(auth)/dev-actions.ts.",
    );
  }
  if (process.env.ZORVO_DEV_LOGIN !== "1") {
    throw new Error(
      "Falta ZORVO_DEV_LOGIN=1 en .env.local para habilitar el acceso de prueba.",
    );
  }
}

export async function entrarComoPrueba() {
  verificarQueEsDesarrollo();

  const admin = createSupabaseAdminClient();

  // OJO: hay que reportar el MISMO valor con el que se construyó el cliente,
  // no process.env. clientEnv se evalúa una sola vez al importar el módulo,
  // así que en desarrollo puede quedar desfasado respecto de process.env si
  // cambiaste .env.local sin reiniciar del todo. Leer la fuente equivocada
  // hace que el mensaje de error mienta justo cuando más lo necesitás.
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

  // Crear el usuario si no existe. email_confirm evita el paso de
  // confirmación, que sin SMTP nunca llegaría.
  const { error: errorAlta } = await admin.auth.admin.createUser({
    email: EMAIL_PRUEBA,
    email_confirm: true,
    user_metadata: { display_name: NOMBRE_PRUEBA },
  });

  // "fetch failed" no es un error de Supabase: es que no se pudo llegar al
  // servidor. El caso típico es tener la URL del stack local en .env.local
  // sin tener Docker corriendo. Vale la pena decirlo con nombre y apellido
  // en vez de propagar dos palabras sin contexto.
  if (errorAlta && /fetch failed|ENOTFOUND|ECONNREFUSED/i.test(errorAlta.message)) {
    throw new Error(
      `No se pudo conectar con Supabase en ${url}. ` +
        `Si esa URL es local (127.0.0.1), cambiala en .env.local por la de tu ` +
        `proyecto (https://<ref>.supabase.co) y reiniciá el servidor.`,
    );
  }

  // Si ya existe, seguimos: es el caso normal a partir de la segunda vez.
  if (errorAlta && !/already|exists|registered/i.test(errorAlta.message)) {
    throw new Error(`No se pudo crear el socio de prueba: ${errorAlta.message}`);
  }

  // generateLink arma el token de un magic link SIN enviarlo. Es la forma
  // limpia de conseguir una sesión sin SMTP y sin inventar una contraseña
  // que después habría que borrar.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: EMAIL_PRUEBA,
  });

  if (error || !data.properties?.hashed_token) {
    throw new Error(`No se pudo generar la sesión de prueba: ${error?.message ?? "sin token"}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error: errorVerif } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "email",
  });

  if (errorVerif) {
    throw new Error(`No se pudo iniciar la sesión de prueba: ${errorVerif.message}`);
  }

  redirect("/club");
}
