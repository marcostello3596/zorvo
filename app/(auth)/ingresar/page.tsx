import Link from "next/link";

import { ZorvoWordmark, ZorvoCup } from "@/components/brand";
import { BotonPrueba } from "@/components/primitives/BotonPrueba";
import { FormularioIngreso } from "./FormularioIngreso";

export const metadata = { title: "Entrar — Zorvo Club" };

/**
 * Server Component a propósito: BotonPrueba lee process.env en el servidor
 * para decidir si existe. Si esta página fuera "use client", el botón de
 * desarrollo tendría que decidirse en el navegador, y esa condición sí se
 * puede manipular.
 */
export default function Ingresar() {
  return (
    <main
      data-surface="espresso"
      className="zrv-grain flex min-h-dvh flex-col bg-espresso text-cream"
    >
      <div className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col px-5 py-7">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Zorvo — inicio">
            <ZorvoWordmark className="h-4 w-auto text-venus" />
          </Link>
          <Link href="/join" className="zrv-label text-[var(--zrv-espresso-200)]">
            Sumarme
          </Link>
        </div>

        <div className="flex-1 pt-12">
          <h1 className="zrv-display text-[clamp(2.5rem,13vw,3.5rem)] leading-[0.9] text-cream">
            Entrar
          </h1>
          <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-cream/85">
            Sin contraseñas. Elegí lo que te resulte más rápido.
          </p>

          <FormularioIngreso />

          <BotonPrueba />
        </div>

        <ZorvoCup className="mx-auto mt-10 h-28 w-auto text-[var(--zrv-espresso-600)]" />
      </div>
    </main>
  );
}
