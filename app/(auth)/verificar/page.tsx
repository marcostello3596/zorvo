import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { FormCodigo } from "@/components/auth/Forms";

export const metadata = { title: "Tu código · ZORVO" };

export default async function Verificar({ searchParams }: { searchParams: Promise<{ email?: string; next?: string; nuevo?: string }> }) {
  const { email, next, nuevo } = await searchParams;
  if (!email) redirect("/ingresar");
  return (
    <AuthShell
      titulo={nuevo ? "Ya casi." : "Revisá tu mail."}
      bajada={
        <>
          Te mandamos un código a <b>{email}</b>. Escribilo acá. Si no aparece, fijate en spam o promociones.
        </>
      }
    >
      <FormCodigo email={email} next={next} />
      <p className="reg__alt">
        ¿No llegó? <Link href={`/ingresar?email=${encodeURIComponent(email)}`} className="link-arrow link-arrow--sm">Pedí otro <span aria-hidden="true">→</span></Link>
      </p>
    </AuthShell>
  );
}
