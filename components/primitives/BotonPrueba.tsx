import { entrarComoPrueba } from "@/app/(auth)/dev-actions";

/**
 * ⚠️ Botón de acceso de prueba — SOLO DESARROLLO.
 *
 * En producción no renderiza nada y no llega ni al HTML. En desarrollo, si
 * falta la variable de entorno, explica qué falta en vez de desaparecer sin
 * decir nada: un componente que se esconde en silencio es imposible de
 * diagnosticar desde el navegador.
 *
 * El aspecto es deliberadamente feo — borde punteado, sin tipografía de
 * marca. Tiene que gritar "esto no es parte del producto" a quien lo vea de
 * reojo en una captura.
 */
export function BotonPrueba() {
  // Primer cerrojo, el que no depende de nadie: Vercel y `next build` ponen
  // NODE_ENV en "production" por su cuenta.
  if (process.env.NODE_ENV === "production") return null;

  // Segundo cerrojo: opt-in explícito. Si falta, lo decimos.
  if (process.env.ZORVO_DEV_LOGIN !== "1") {
    return (
      <div className="mt-8 border border-dashed border-[var(--zrv-espresso-400)] p-4">
        <p className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--zrv-espresso-300)]">
          Acceso de prueba desactivado
        </p>
        <p className="text-xs leading-relaxed text-cream/60">
          Agregá <code className="text-venus">ZORVO_DEV_LOGIN=1</code> a{" "}
          <code className="text-venus">.env.local</code> y reiniciá el servidor
          (<code className="text-venus">npm run dev</code>). Los cambios de
          entorno no se recargan solos.
        </p>
      </div>
    );
  }

  return (
    <form action={entrarComoPrueba} className="mt-8">
      <div className="border border-dashed border-[var(--zrv-espresso-400)] p-4">
        <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--zrv-espresso-300)]">
          Solo desarrollo
        </p>
        <button
          type="submit"
          className="w-full border border-[var(--zrv-espresso-400)] px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-cream/80 transition-colors hover:bg-[var(--zrv-espresso-800)]"
        >
          Entrar como socio de prueba
        </button>
        <p className="mt-3 text-xs leading-relaxed text-cream/50">
          Sin mail y sin Google. Este botón no existe en producción.
        </p>
      </div>
    </form>
  );
}
