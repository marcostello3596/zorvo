import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { BotonGoogle, FormIngreso } from "@/components/auth/Forms";
import { BotonPrueba } from "@/components/auth/BotonPrueba";

export const metadata = { title: "Entrar · ZORVO" };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const { next, email } = await searchParams;
  const esAdmin = next?.startsWith("/admin");
  return (
    <AuthShell
      titulo={esAdmin ? "Mostrador." : "Hola de nuevo."}
      bajada={esAdmin ? "Entrá con el email que te dio de alta el encargado." : "Poné tu email y te mandamos un código para entrar."}
    >
      <FormIngreso next={next} email={email} />
      <BotonGoogle />
      {!esAdmin && (
        <p className="reg__alt">
          ¿Todavía no tenés tarjeta? <Link href="/join" className="link-arrow link-arrow--sm">Sumate <span aria-hidden="true">→</span></Link>
        </p>
      )}
      <BotonPrueba />
    </AuthShell>
  );
}
