import type { ReactNode } from "react";

import { salir } from "@/app/(auth)/actions";
import { Svg } from "@/components/Svg";
import { ClubProvider } from "@/components/club/ClubProvider";
import { getPremiosPendientes, getSocio, getTarjeta } from "@/lib/queries";

export const metadata = { title: "Mi tarjeta · ZORVO" };

/**
 * El club entero comparte este layout: con la sesión ya validada por
 * proxy.ts, busca al socio y su tarjeta una vez y se los pasa al provider
 * (QR, Wallet, aviso de Z nuevas). Un usuario sin membresía es raro pero
 * posible; la pantalla lo dice en vez de romperse.
 */
export default async function ClubLayout({ children }: { children: ReactNode }) {
  const socio = await getSocio();

  if (!socio) {
    return (
      <main className="view view--app view--auth" id="contenido">
        <div className="app">
          <section className="reg">
            <Svg name="mascot" className="reg__mascot" />
            <p className="label">Club de la Z</p>
            <h1 className="h-display h-display--app">Algo no cerró.</h1>
            <p className="reg__lede">Entraste, pero no encontramos tu tarjeta. Salí y volvé a entrar; si sigue igual, avisanos en el local.</p>
            <form action={salir}>
              <button className="btn btn--ink btn--block" type="submit">Salir</button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const [tarjeta, premios] = await Promise.all([getTarjeta(socio.memberId), getPremiosPendientes(socio.memberId)]);

  return (
    <ClubProvider
      socio={{ nombre: socio.nombre, memberCode: socio.memberCode }}
      estado={{ ...tarjeta, premios: premios.length }}
    >
      {children}
    </ClubProvider>
  );
}
