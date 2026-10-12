import Link from "next/link";

import { Svg } from "@/components/Svg";
import { getRecorridos, getSocio } from "@/lib/queries";

export const metadata = { title: "Recorridos · ZORVO" };

export default async function Recorridos() {
  const socio = (await getSocio())!;
  const recorridos = await getRecorridos(socio.memberId);

  return (
    <section className="screen" aria-labelledby="rec-title">
      <p className="label">Club de la Z</p>
      <h1 className="h-display h-display--app" id="rec-title">Recorridos</h1>
      <p className="app-progress">Avanzan solos mientras tomás café. No hay nada que activar: si desbloqueás algo, te avisamos.</p>

      {recorridos.length === 0 ? (
        <p className="hist__empty">Todavía no hay recorridos activos. Ya vienen.</p>
      ) : (
        <ul className="rutas">
          {recorridos.map((r, i) => {
            const completo = r.completadoEl !== null;
            const pct = r.total > 0 ? Math.min((r.hechos / r.total) * 100, 100) : 0;
            const esCarta = r.slug.includes("carta");
            return (
              <li key={r.slug} className={`ruta${completo ? " ruta--done" : ""}`} style={{ ["--i" as string]: i }}>
                <div className="ruta__head">
                  <h2>{r.nombre}</h2>
                  {completo ? <span className="ruta__ok"><Svg name="zsolid" />Listo</span> : <span className="ruta__n">{r.hechos}/{r.total}</span>}
                </div>
                {r.resumen ? <p className="ruta__txt">{r.resumen}</p> : null}
                <div className="ruta__bar" role="img" aria-label={`${r.hechos} de ${r.total}`}>
                  <span style={{ width: `${pct}%` }} />
                </div>
                <div className="ruta__foot">
                  {r.premio ? <span className="label">Premio · {r.premio}</span> : <span />}
                  {esCarta ? (
                    <Link href="/club/carta" className="link-arrow link-arrow--sm">Ver la carta <span aria-hidden="true">→</span></Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
