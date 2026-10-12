import { FilaMovimiento, fmtMes } from "@/components/club/Historial";
import { getHistorial, getSocio, getTarjeta } from "@/lib/queries";
import type { Movimiento } from "@/lib/queries";

export const metadata = { title: "Tus cafés · ZORVO" };

export default async function Historial() {
  const socio = (await getSocio())!;
  const [tarjeta, movimientos] = await Promise.all([getTarjeta(socio.memberId), getHistorial(socio.memberId, 120)]);

  const grupos = new Map<string, Movimiento[]>();
  for (const m of movimientos) {
    const k = fmtMes.format(new Date(m.fecha));
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(m);
  }

  return (
    <section className="screen" aria-labelledby="hist-title">
      <p className="label">Club de la Z</p>
      <h1 className="h-display h-display--app" id="hist-title">Tus cafés</h1>
      <div className="hist-stats">
        <div className="stat"><b>{tarjeta.total}</b><span className="label">Z sumadas</span></div>
        <div className="stat"><b>{tarjeta.tarjetas}</b><span className="label">Tarjetas completas</span></div>
        <div className="stat"><b>{tarjeta.z}/{tarjeta.target}</b><span className="label">Tarjeta actual</span></div>
      </div>
      <div>
        {grupos.size ? (
          [...grupos].map(([mes, items]) => (
            <div key={mes}>
              <h2 className="hist__month label">{mes}</h2>
              <ul className="hist">
                {items.map((m) => <FilaMovimiento key={`${m.tipo}-${m.id}`} m={m} />)}
              </ul>
            </div>
          ))
        ) : (
          <p className="hist__empty">Acá vas a ver cada café que sumes.</p>
        )}
      </div>
    </section>
  );
}
