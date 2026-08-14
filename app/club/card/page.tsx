import Link from "next/link";
import { redirect } from "next/navigation";

import { ZorvoWordmark } from "@/components/brand";
import { CredencialRotativa } from "@/components/club/CredencialRotativa";
import { getSocio } from "@/lib/queries";

export const metadata = { title: "Credencial — Zorvo Club" };

/**
 * La credencial a pantalla completa. Es un objeto físico, no una página web.
 *
 * El QR rota cada 30 segundos generado en el dispositivo, sin red (§6). El
 * member_code de abajo es el camino que no depende de que la cámara funcione:
 * si hay poca luz o la pantalla está rayada, el barista lo tipea y listo.
 */
export default async function Card() {
  const socio = await getSocio();
  if (!socio) redirect("/ingresar");

  return (
    <main
      data-surface="espresso"
      className="zrv-grain flex min-h-dvh flex-col bg-espresso px-6 py-8 text-cream"
    >
      <div className="flex items-center justify-between">
        <ZorvoWordmark className="h-4 w-auto text-venus" />
        <Link href="/club" className="zrv-label -mr-2 flex h-11 items-center px-2">
          Cerrar
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-7 py-8">
        <CredencialRotativa className="w-full max-w-[19rem]" />

        <div className="text-center">
          <p className="zrv-display text-4xl leading-none text-cream">
            {socio.nombre}
          </p>
          <p className="zrv-data mt-3 text-xl text-venus">{socio.memberCode}</p>
        </div>
      </div>

      <div className="border-t border-[var(--zrv-espresso-600)] pt-5 text-center">
        <p className="zrv-label text-[var(--zrv-espresso-200)]">
          Se renueva cada 30 segundos
        </p>
        <p className="mt-2 text-sm text-cream/70">
          Si la cámara no lee, decile a quien te atiende tu código.
        </p>
      </div>
    </main>
  );
}
