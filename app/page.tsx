import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Marquee } from "@/components/brand/Marquee";
import { StackedLabel } from "@/components/brand/StackedLabel";
import { ButtonLink } from "@/components/primitives/Button";
import {
  ZorvoWordmark,
  ZorvoWalk,
  ZorvoCup,
  ZorvoBarista,
} from "@/components/brand";
import {
  SITE,
  MARQUEE_TOP,
  RITUAL,
  RECORRIDO_DESTACADO,
  CARTA,
  MANIFIESTO,
  SI_SOMOS,
  NO_SOMOS,
} from "@/lib/content";

const ICONOS = {
  walk: ZorvoWalk,
  cup: ZorvoCup,
  barista: ZorvoBarista,
} as const;

export default function Home() {
  return (
    <>
      {/* Ticker superior — el claim de marca corriendo */}
      <Marquee seconds={38} className="bg-venus text-espresso-deep">
        <span className="zrv-label whitespace-nowrap py-2.5 pr-10 font-bold">
          {MARQUEE_TOP}
        </span>
        <span aria-hidden="true" className="pr-10 text-espresso-deep">
          ●
        </span>
      </Marquee>

      <Nav />

      <main id="contenido">
        {/* ══════════════════════════ HERO ══════════════════════════ */}
        <section className="zrv-grain relative overflow-hidden bg-espresso text-cream">
          <div className="mx-auto max-w-[90rem] px-4 pb-0 pt-10 md:px-8 md:pt-16">
            <p className="zrv-label mb-6 text-venus">
              {SITE.bajada} — {SITE.desde}
            </p>

            <h1 className="sr-only">
              Zorvo, Cool Brew Coffee. {SITE.claim}
            </h1>

            <ZorvoWordmark
              className="h-auto w-full text-venus"
              title="ZORVO"
            />

            <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
              <div className="max-w-[34ch]">
                <p className="zrv-display text-[clamp(1.75rem,7vw,3rem)] text-cream">
                  Café al paso.
                  <br />
                  Bien hecho, en serio.
                </p>
                <p className="mt-5 text-base leading-relaxed text-cream/85 md:text-lg">
                  Que llevarte un café rápido no significa conformarte con
                  cualquier café. {SITE.claim}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/join" variant="accent" size="lg">
                    Sumate al Club
                  </ButtonLink>
                  <ButtonLink
                    href="#la-carta"
                    variant="outline"
                    size="lg"
                    className="text-cream"
                  >
                    Ver la carta
                  </ButtonLink>
                </div>
              </div>

              {/* La ilustración pisa el borde inferior: composición asimétrica */}
              <ZorvoWalk
                className="mx-auto -mb-1 h-[15rem] w-auto text-venus md:mx-0 md:h-[22rem]"
                title="Persona caminando con un café Zorvo"
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════ EL CLUB ══════════════════════════ */}
        <section
          id="el-club"
          aria-labelledby="tit-club"
          className="zrv-grain scroll-mt-14 bg-olive text-cream"
        >
          <div className="mx-auto max-w-[90rem] px-4 py-16 md:px-8 md:py-28">
            <div className="flex gap-6 md:gap-14">
              <StackedLabel text="EL CLUB" id="tit-club" className="shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="zrv-display max-w-[18ch] text-[clamp(2rem,9vw,4.5rem)] text-venus">
                  Tomás café. Nos acordamos. Te llevás una gorra.
                </p>
                <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-cream/85 md:text-lg">
                  El Club de Zorvo es gratis y no tiene letra chica. No hay
                  puntos que vencen, no hay tarjetita de cartón que se te pierde
                  en la billetera, no hay que gastar un mínimo. Solo tomás
                  café y el recorrido avanza solo.
                </p>

                {/* Los tres pasos del ritual */}
                <ol className="mt-14 grid gap-px overflow-hidden border border-[var(--zrv-olive-500)] bg-[var(--zrv-olive-500)] md:grid-cols-3">
                  {RITUAL.map((paso) => {
                    const Icono = ICONOS[paso.icono];
                    return (
                      <li
                        key={paso.n}
                        className="flex flex-col gap-5 bg-olive p-6 md:p-8"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="zrv-data text-3xl text-venus">
                            {paso.n}
                          </span>
                          <Icono className="h-20 w-auto text-[var(--zrv-olive-400)]" />
                        </div>
                        <div>
                          <h3 className="zrv-display text-2xl text-cream">
                            {paso.titulo}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-cream/80">
                            {paso.texto}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Recorrido destacado — el motivo real de existir del Club */}
                <div className="mt-10 border-2 border-venus bg-[var(--zrv-olive-800)] p-6 md:p-10">
                  <p className="zrv-label text-venus">Recorrido destacado</p>
                  <h3 className="zrv-display mt-3 text-[clamp(2rem,7vw,3.5rem)] text-cream">
                    {RECORRIDO_DESTACADO.nombre}
                  </h3>
                  <p className="mt-3 max-w-[46ch] text-lg text-venus">
                    {RECORRIDO_DESTACADO.promesa}
                  </p>
                  <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-cream/80">
                    {RECORRIDO_DESTACADO.detalle}
                  </p>

                  {/* 13 casillas: la colección, hecha visible */}
                  <div
                    className="mt-8 flex flex-wrap gap-1.5"
                    role="img"
                    aria-label={`El recorrido tiene ${RECORRIDO_DESTACADO.total} cafés`}
                  >
                    {Array.from({ length: RECORRIDO_DESTACADO.total }).map(
                      (_, i) => (
                        <span
                          key={i}
                          className="h-8 w-8 border border-[var(--zrv-olive-400)]"
                        />
                      ),
                    )}
                  </div>

                  <div className="mt-8">
                    <ButtonLink href="/join" variant="accent" size="lg">
                      Empezar el recorrido
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ LA CARTA ══════════════════════════ */}
        <section
          id="la-carta"
          aria-labelledby="tit-carta"
          className="scroll-mt-14 bg-cream text-ink"
        >
          <div className="mx-auto max-w-[90rem] px-4 py-16 md:px-8 md:py-28">
            <div className="flex gap-6 md:gap-14">
              <StackedLabel
                text="LA CARTA"
                id="tit-carta"
                className="shrink-0 text-espresso"
              />

              <div className="min-w-0 flex-1">
                <p className="zrv-display max-w-[16ch] text-[clamp(2rem,9vw,4.5rem)] text-espresso">
                  Trece cafés. Ninguno de relleno.
                </p>
                <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--zrv-stone-700)] md:text-lg">
                  Sin precios acá: para eso está el mostrador. Esta es la lista
                  que tenés que completar si querés la gorra.
                </p>

                <ul className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                  {CARTA.map((cafe, i) => (
                    <li
                      key={cafe.slug}
                      className="flex items-start gap-4 bg-cream p-5 md:p-6"
                    >
                      <span className="zrv-data mt-0.5 text-xs text-[var(--zrv-stone-500)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="zrv-display text-2xl text-ink">
                            {cafe.nombre}
                          </h3>
                          <span
                            className={`zrv-label px-1.5 py-0.5 ${
                              cafe.familia === "Frío"
                                ? "bg-[var(--zrv-olive-100)] text-[var(--zrv-olive-800)]"
                                : "bg-[var(--zrv-espresso-50)] text-[var(--zrv-espresso-900)]"
                            }`}
                          >
                            {cafe.familia}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-[var(--zrv-stone-700)]">
                          {cafe.nota}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ LA IDEA ══════════════════════════ */}
        <section
          id="la-idea"
          aria-labelledby="tit-idea"
          className="zrv-grain scroll-mt-14 bg-espresso text-cream"
        >
          <div className="mx-auto max-w-[90rem] px-4 py-16 md:px-8 md:py-28">
            <div className="flex gap-6 md:gap-14">
              <StackedLabel text="LA IDEA" id="tit-idea" className="shrink-0" />

              <div className="min-w-0 flex-1">
                <div className="max-w-[58ch]">
                  {MANIFIESTO.map((parrafo, i) => (
                    <p
                      key={i}
                      className={
                        i === 2
                          ? "zrv-display my-8 text-[clamp(2rem,8vw,3.5rem)] text-venus"
                          : "mb-5 text-base leading-relaxed text-cream/85 md:text-lg"
                      }
                    >
                      {parrafo}
                    </p>
                  ))}
                </div>

                {/* Qué sí es / qué no es — está literal en el PDF de marca */}
                <div className="mt-14 grid gap-px border border-[var(--zrv-espresso-500)] bg-[var(--zrv-espresso-500)] md:grid-cols-2">
                  <div className="bg-[var(--zrv-olive-700)] p-6 md:p-8">
                    <h3 className="zrv-label mb-4 text-venus">Qué sí somos</h3>
                    <ul className="space-y-2">
                      {SI_SOMOS.map((x) => (
                        <li key={x} className="text-base text-cream">
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[var(--zrv-espresso-800)] p-6 md:p-8">
                    <h3 className="zrv-label mb-4 text-[var(--zrv-espresso-300)]">
                      Qué no somos
                    </h3>
                    <ul className="space-y-2">
                      {NO_SOMOS.map((x) => (
                        <li
                          key={x}
                          className="text-base text-cream/70 line-through decoration-[var(--zrv-espresso-400)]"
                        >
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ EL LUGAR ══════════════════════════ */}
        <section
          id="el-lugar"
          aria-labelledby="tit-lugar"
          className="zrv-grain scroll-mt-14 bg-venus text-espresso-deep"
        >
          <div className="mx-auto max-w-[90rem] px-4 py-16 md:px-8 md:py-28">
            <div className="flex gap-6 md:gap-14">
              <StackedLabel text="EL LUGAR" id="tit-lugar" className="shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="zrv-display max-w-[14ch] text-[clamp(2rem,9vw,4.5rem)]">
                  Un refugio breve en el ritmo de la ciudad.
                </p>

                <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <h3 className="zrv-label mb-2">Dónde</h3>
                      <p className="text-lg leading-snug">{SITE.direccion}</p>
                    </div>
                    <div>
                      <h3 className="zrv-label mb-2">Cuándo</h3>
                      <ul className="space-y-1">
                        {SITE.horarios.map((h) => (
                          <li
                            key={h.dias}
                            className="flex justify-between gap-4 border-b border-espresso-deep/20 py-1 text-sm"
                          >
                            <span>{h.dias}</span>
                            <span className="zrv-data">{h.horas}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <ZorvoBarista className="mx-auto h-[13rem] w-auto text-olive md:mx-0 md:h-[17rem]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ticker de cierre — el ritual, en loop */}
        <Marquee seconds={26} className="border-y-2 border-espresso bg-cream text-espresso">
          {RITUAL.map((p) => (
            <span key={p.n} className="flex items-center whitespace-nowrap py-3">
              <span className="zrv-data px-3 text-xs opacity-60">{p.n}</span>
              <span className="zrv-display pr-3 text-xl">{p.titulo}</span>
              <ZorvoCup className="h-5 w-auto shrink-0" title="" />
              <span className="pr-6" />
            </span>
          ))}
        </Marquee>
      </main>

      <Footer />
    </>
  );
}
