import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { BotonGoogle, FormAlta } from "@/components/auth/Forms";
import { BotonPrueba } from "@/components/auth/BotonPrueba";

export const metadata = { title: "Sumate al club · ZORVO" };

export default function Join() {
  return (
    <AuthShell titulo="Sumate al club." bajada="Tu tarjeta en 20 segundos. Cada café que pidas es una Z y a la décima invitamos nosotros.">
      <FormAlta />
      <BotonGoogle />
      <p className="reg__alt">
        ¿Ya tenés tarjeta? <Link href="/ingresar" className="link-arrow link-arrow--sm">Entrá <span aria-hidden="true">→</span></Link>
      </p>
      <BotonPrueba />
    </AuthShell>
  );
}
