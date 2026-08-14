import { redirect } from "next/navigation";

import { getSocio, getRecorridos } from "@/lib/queries";

export const metadata = { title: "Recorridos — Zorvo Club" };

export default async function Recorridos() {
  const socio = await getSocio();
  if (!socio) redirect("/ingresar");

  const recorridos = await getRecorridos(socio.memberId);

  return (
    <main className="flex-1">
      <header className="border-b border-hairline px-5 py-7">
        <h1 className="zrv-display text-4xl text-ink">Recorridos</h1>
        <p className="mt-2 text-sm text-[var(--zrv-stone-700)]">
          Van avanzando solos mientras tomás café. No hay nada que activar.
        </p>
      </header>

      {recorridos.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-[var(--zrv-stone-600)]">
          Todavía no hay recorridos activos.
        </p>
      ) : (
        <ul>
          {recorridos.map((r) => {
            const completo = r.completadoEl !== null;
            const pct = r.total > 0 ? Math.min((r.hechos / r.total) * 100, 100) : 0;
            return (
              <li key={r.slug} className="border-b border-hairline px-5 py-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="zrv-display text-2xl text-ink">{r.nombre}</h2>
                  {completo && (
                    <span className="zrv-label shrink-0 bg-[var(--zrv-olive-100)] px-2 py-1 text-[var(--zrv-olive-800)]">
                      Listo
                    </span>
                  )}
                </div>

                {r.resumen && (
                  <p className="mt-1 text-sm text-[var(--zrv-stone-700)]">
                    {r.resumen}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="h-1.5 flex-1 bg-[var(--zrv-stone-200)]"
                    role="img"
                    aria-label={`${r.hechos} de ${r.total}`}
                  >
                    <div
                      className={completo ? "h-full bg-success" : "h-full bg-espresso"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="zrv-data shrink-0 text-sm text-ink">
                    {r.hechos}/{r.total}
                  </span>
                </div>

                {r.premio && (
                  <p className="zrv-label mt-3 text-[var(--zrv-stone-600)]">
                    Premio — {r.premio}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="px-5 py-8 text-center text-sm text-[var(--zrv-stone-600)]">
        Vamos agregando recorridos nuevos. No hay que estar atento: si
        desbloqueás algo, te avisamos.
      </p>
    </main>
  );
}
