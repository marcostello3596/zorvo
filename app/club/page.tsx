import Link from "next/link";

import { salir } from "@/app/(auth)/actions";
import { Svg } from "@/components/Svg";
import { BotonPremio, BotonQr, BotonWallet } from "@/components/club/Bits";
import { codigoLegible } from "@/components/club/codigo";
import { ListaMovimientos } from "@/components/club/Historial";
import { LoyaltyCardView } from "@/components/club/LoyaltyCardView";
import { getHistorial, getPremiosPendientes, getSocio, getTarjeta } from "@/lib/queries";

export default async function MiTarjeta() {
  const socio = (await getSocio())!; // el layout ya cubrió el caso sin socio
  const [tarjeta, premios, recientes] = await Promise.all([
    getTarjeta(socio.memberId),
    getPremiosPendientes(socio.memberId),
    getHistorial(socio.memberId, 3),
  ]);
  const faltan = tarjeta.target - tarjeta.z;
  const nombre = socio.nombre.split(" ")[0];

  return (
    <section className="screen" aria-labelledby="app-hello">
      <div className="app-hello">
        <div>
          <p className="label">Socio {codigoLegible(socio.memberCode)}</p>
          <h1 className="app-hello__name" id="app-hello">Hola, {nombre}</h1>
        </div>
        <Svg name="mascot" className="app-hello__mascot" />
      </div>

      <LoyaltyCardView z={tarjeta.z} target={tarjeta.target} tarjetas={tarjeta.tarjetas} nombre={socio.nombre} numero={codigoLegible(socio.memberCode)} />

      {premios.length > 0 ? <BotonPremio n={premios.length} /> : null}

      <p className="app-progress">
        {tarjeta.total === 0 ? (
          <>Mostrá tu QR en tu próximo café y sumá tu <b>primera Z</b>.</>
        ) : tarjeta.z === 0 ? (
          <>Tarjeta nueva. Te faltan <b>{faltan} Z</b> para el próximo café de regalo.</>
        ) : faltan === 1 ? (
          <><b>Una más</b> y el próximo va por nuestra cuenta.</>
        ) : (
          <>Te faltan <b>{faltan} Z</b> para tu café de regalo.</>
        )}
      </p>

      <div className="app-actions">
        <BotonQr />
        <BotonWallet />
      </div>

      <div className="app-recent">
        <div className="app-recent__head">
          <h2>Últimos cafés</h2>
          <Link href="/club/historial" className="link-arrow link-arrow--sm">
            Ver todo <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ListaMovimientos items={recientes} vacio="Todavía no sumaste cafés. El primero está a un QR de distancia." />
      </div>

      <form action={salir} className="app-out">
        <button className="app-reset label" type="submit">Cerrar sesión</button>
      </form>
    </section>
  );
}
