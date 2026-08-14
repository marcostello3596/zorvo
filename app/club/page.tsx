import Link from "next/link";
import { redirect } from "next/navigation";

import { ZorvoWordmark, ZorvoCup } from "@/components/brand";
import { ButtonLink } from "@/components/primitives/Button";
import {
  getSocio,
  getRecorridos,
  getEstadisticas,
  getLoDeSiempre,
} from "@/lib/queries";
import { salir } from "../(auth)/actions";

export const metadata = { title: "Tu Zorvo — Club" };

export default async function ClubHome() {
  const socio = await getSocio();
  if (!socio) redirect("/ingresar");

  const [recorridos, stats, loDeSiempre] = await Promise.all([
    getRecorridos(socio.memberId),
    getEstadisticas(socio.memberId),
    getLoDeSiempre(socio.memberId),
  ]);

  // El recorrido activo es el primero sin completar; si están todos
  // completos, mostramos el primero igual — es una vitrina, no un pendiente.
  const destacado = recorridos.find((r) => !r.completadoEl) ?? recorridos[0];

  return (
    <main className="flex-1">
      {/* ─── LA CREDENCIAL ───
          Campo espresso a sangre con grano. Es la página 11 del PDF
          convertida en pantalla: mucho aire, nombre gigante, amarillo escaso. */}
      <section
        data-surface="espresso"
        className="zrv-grain bg-espresso px-5 pb-8 pt-6 text-cream"
      >
        <div className="flex items-center justify-between">
          <ZorvoWordmark className="h-4 w-auto text-venus" />
          <span className="zrv-data text-xs text-[var(--zrv-espresso-200)]">
            {socio.memberCode}
          </span>
        </div>

        <h1 className="zrv-display mt-8 text-[clamp(2.75rem,15vw,3.75rem)] leading-[0.88] text-cream">
          {socio.nombre}
        </h1>

        <p className="zrv-label mt-3 text-[var(--zrv-espresso-200)]">
          Socio desde {socio.desde}
        </p>

        {/* Sin QR acá: mostrar uno decorativo invita a que el barista intente
            escanearlo y falle sin explicación. El código real vive en /club/card,
            que es donde el socio va cuando le toca el turno. */}
        <Link
          href="/club/card"
          className="mt-7 flex items-center gap-4 rounded-[2px] bg-cream p-4 transition-transform active:scale-[0.99]"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-espresso">
            <ZorvoCup className="h-8 w-auto text-venus" title="" />
          </span>
          <span className="min-w-0">
            <span className="zrv-display block text-xl text-espresso">
              Mostrar credencial
            </span>
            <span className="mt-1 block text-sm text-[var(--zrv-stone-600)]">
              Pantalla completa, brillo al máximo. Funciona sin señal.
            </span>
          </span>
        </Link>
      </section>

      {/* ─── PROGRESO DEL RECORRIDO ─── */}
      {destacado && (
        <section className="border-b border-hairline px-5 py-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="zrv-label text-[var(--zrv-stone-600)]">
              Recorrido activo
            </h2>
            <Link
              href="/club/recorridos"
              className="zrv-label text-espresso underline-offset-4 hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <p className="zrv-display mt-3 text-3xl text-ink">{destacado.nombre}</p>

          <div className="mt-5 flex items-end justify-between gap-4">
            <span className="zrv-data text-4xl text-espresso">
              {destacado.hechos}
              <span className="text-lg text-[var(--zrv-stone-500)]">
                /{destacado.total}
              </span>
            </span>
            <span className="text-right text-sm text-[var(--zrv-stone-700)]">
              {destacado.completadoEl ? (
                <>Completado. Pasá a buscar tu {destacado.premio?.toLowerCase()}.</>
              ) : (
                <>
                  Te faltan{" "}
                  <strong className="text-ink">
                    {Math.max(destacado.total - destacado.hechos, 0)}
                  </strong>{" "}
                  para tu {destacado.premio?.toLowerCase() ?? "recompensa"}
                </>
              )}
            </span>
          </div>

          {/* Las casillas: la colección hecha objeto. Es el corazón del Club. */}
          <ul
            className="mt-4 flex flex-wrap gap-1.5"
            aria-label={`${destacado.hechos} de ${destacado.total} cafés probados`}
          >
            {Array.from({ length: destacado.total }).map((_, i) => (
              <li
                key={i}
                className={`flex h-9 w-9 items-center justify-center border ${
                  i < destacado.hechos
                    ? "border-espresso bg-espresso text-venus"
                    : "border-line bg-transparent"
                }`}
              >
                {i < destacado.hechos && (
                  <ZorvoCup className="h-4 w-auto" title="" />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── DATOS ───
          Mono tabular. En el PDF los números son mono: usar mono acá es marca,
          no convención de dashboard. */}
      <section className="grid grid-cols-3 border-b border-hairline">
        {[
          { n: stats.cafesTotales, l: "Cafés" },
          { n: stats.deLaCarta, l: "De la carta" },
          { n: stats.esteMes, l: "Este mes" },
        ].map((d, i) => (
          <div
            key={d.l}
            className={`px-5 py-6 ${i < 2 ? "border-r border-hairline" : ""}`}
          >
            <p className="zrv-data text-3xl text-ink">{d.n}</p>
            <p className="zrv-label mt-1 text-[var(--zrv-stone-600)]">{d.l}</p>
          </div>
        ))}
      </section>

      {/* ─── LO DE SIEMPRE ───
          Solo aparece si de verdad hay un hábito. Inventarle un "lo de
          siempre" a alguien que vino dos veces es peor que no mostrarlo. */}
      {loDeSiempre && (
        <section className="border-b border-hairline px-5 py-8">
          <h2 className="zrv-label text-[var(--zrv-stone-600)]">Lo de siempre</h2>
          <p className="zrv-display mt-2 text-3xl text-ink">{loDeSiempre}</p>
          <p className="mt-2 text-sm text-[var(--zrv-stone-700)]">
            Lo pedís sin decirlo. Ya lo sabemos.
          </p>
        </section>
      )}

      {/* ─── WALLET ─── */}
      <section className="px-5 py-8">
        <h2 className="zrv-label text-[var(--zrv-stone-600)]">
          Llevala en el teléfono
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--zrv-stone-700)]">
          Sumá tu credencial a la billetera y no hace falta ni abrir la app.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <ButtonLink href="/club" variant="primary" size="lg" className="w-full">
            Agregar a Google Wallet
          </ButtonLink>
          <ButtonLink
            href="/club"
            variant="outline"
            size="lg"
            className="w-full text-ink opacity-45"
          >
            Apple Wallet — pronto
          </ButtonLink>
        </div>
      </section>

      {/* Salir va acá abajo y no en la navegación: es una acción que se busca
          una vez cada mucho, no un destino. */}
      <form action={salir} className="px-5 pb-10">
        <button
          type="submit"
          className="zrv-label text-[var(--zrv-stone-500)] underline-offset-4 hover:underline"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
