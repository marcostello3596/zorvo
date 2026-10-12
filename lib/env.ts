import { z } from "zod";

/**
 * Validación de entorno (§10).
 *
 * Si falta un secreto, queremos que falle el BUILD, no una request a las
 * tres de la tarde con la fila llena. Por eso esto se evalúa al importar.
 *
 * La separación cliente/servidor no es cosmética: `serverEnv` contiene la
 * service_role key, que nunca puede llegar al navegador. El `server-only`
 * de lib/supabase/server.ts es la segunda barrera.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  /** Master key para derivar los secretos HMAC de credencial (§6). */
  CREDENTIAL_HMAC_MASTER: z.string().min(32, "CREDENTIAL_HMAC_MASTER debe tener al menos 32 caracteres"),
});

function parse<T extends z.ZodTypeAny>(schema: T, source: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Entorno inválido (${label}):\n${detail}\n\nRevisá .env.local contra .env.example.`);
  }
  return result.data;
}

// Next inlinea las NEXT_PUBLIC_* en build, así que hay que nombrarlas
// explícitamente: process.env no es un objeto real del lado del cliente.
export const clientEnv = parse(
  clientSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // La integración de Supabase en Vercel puede cargar la clave con el
    // nombre nuevo (publishable). Las dos sirven igual.
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  "cliente",
);

/**
 * Solo se puede llamar desde el servidor. Es función y no constante a
 * propósito: si fuera constante, importarla desde un componente de cliente
 * rompería el build aun sin usarla.
 */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() se llamó desde el navegador");
  }
  return parse(
    serverSchema,
    {
      ...process.env,
      // Ídem: la secret key nueva (sb_secret_…) reemplaza a la service_role.
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
    },
    "servidor",
  );
}
