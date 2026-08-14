import { redirect } from "next/navigation";

import { ZorvoCup } from "@/components/brand";
import { getSocio, getCarta } from "@/lib/queries";

export const metadata = { title: "La carta — Zorvo Club" };

/**
 * El corazón emocional del Club: lo que probaste, y lo que falta en silueta.
 * Es lo que convierte "tomar café" en "completar algo".
 */
export default async function CartaClub() {
  const socio = await getSocio();
  if (!socio) redirect("/ingresar");

  const carta = await getCarta(socio.memberId);
  const probados = carta.filter((c) => c.probado).length;
  const faltan = carta.length - probados;

  return (
    <main className="flex-1">
      <header className="border-b border-hairline px-5 py-7">
        <h1 className="zrv-display text-4xl text-ink">La carta</h1>
        <div className="mt-4 flex items-end justify-between gap-4">
          <p className="zrv-data text-4xl text-espresso">
            {probados}
            <span className="text-lg text-[var(--zrv-stone-500)]">
              /{carta.length}
            </span>
          </p>
          <p className="max-w-[22ch] text-right text-sm text-[var(--zrv-stone-700)]">
            {faltan === 0 ? (
              <>Los probaste todos. La gorra es tuya.</>
            ) : (
              <>
                Te faltan <strong className="text-ink">{faltan}</strong> para la
                gorra.
              </>
            )}
          </p>
        </div>
      </header>

      {carta.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-[var(--zrv-stone-600)]">
          Todavía no hay carta cargada.
        </p>
      ) : (
        <ul>
          {carta.map((cafe, i) => (
            <li
              key={cafe.id}
              className={`flex items-start gap-4 border-b border-hairline px-5 py-4 ${
                cafe.probado ? "" : "bg-[var(--zrv-stone-50)]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border ${
                  cafe.probado
                    ? "border-espresso bg-espresso text-venus"
                    : "border-dashed border-line text-[var(--zrv-stone-400)]"
                }`}
              >
                <ZorvoCup className="h-4 w-auto" title="" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    className={`zrv-display text-2xl ${
                      cafe.probado ? "text-ink" : "text-[var(--zrv-stone-500)]"
                    }`}
                  >
                    {cafe.nombre}
                  </h2>
                  <span className="zrv-data shrink-0 text-xs text-[var(--zrv-stone-500)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p
                  className={`mt-1 text-sm leading-relaxed ${
                    cafe.probado
                      ? "text-[var(--zrv-stone-700)]"
                      : "text-[var(--zrv-stone-500)]"
                  }`}
                >
                  {cafe.probado ? cafe.nota : "Todavía no lo probaste."}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="px-5 py-8 text-center text-sm text-[var(--zrv-stone-600)]">
        Cada café que probás por primera vez suma. Repetir no suma, pero
        tampoco está mal.
      </p>
    </main>
  );
}
