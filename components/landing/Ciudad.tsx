import { Marquee } from "@/components/brand/Marquee";
import { CIUDAD } from "@/lib/content";
import { ANCHO, Marca } from "./Marca";

/**
 * Acto I — la ciudad no frena.
 * Dos filas de verbos corriendo en sentidos opuestos: la gente que va y la
 * que viene. Son decorativas (aria-hidden): el texto completo ya está arriba
 * en el h2, así que el lector de pantalla no se pierde nada.
 */
function Verbos({ reverse = false, clase }: { reverse?: boolean; clase: string }) {
  return (
    <Marquee seconds={reverse ? 34 : 26} reverse={reverse} repeat={2}>
      {CIUDAD.verbos.map((v) => (
        <span key={v} className={`zrv-display flex items-center whitespace-nowrap text-[clamp(3.25rem,10vw,9.5rem)] leading-[1] ${clase}`}>
          {v}
          <span className="px-[0.35em] text-[0.4em] opacity-50">●</span>
        </span>
      ))}
    </Marquee>
  );
}

export function Ciudad() {
  return (
    <section aria-labelledby="ciudad-titulo" className="overflow-hidden bg-cream text-ink">
      <div className={`${ANCHO} pt-20 md:pt-32`}>
        <Marca n="01" texto={CIUDAD.marca} className="text-espresso" />
        <h2
          id="ciudad-titulo"
          className="zrv-display zrv-anim-subir mt-6 text-[clamp(3rem,10.5vw,10rem)] leading-[0.84] text-espresso"
        >
          {CIUDAD.titulo}
        </h2>
      </div>

      <div aria-hidden="true" className="mt-10 md:mt-16">
        <Verbos clase="text-espresso" />
        <Verbos reverse clase="zrv-calado" />
      </div>

      <div className={`${ANCHO} grid pb-20 pt-12 md:grid-cols-12 md:pb-32 md:pt-20`}>
        <p className="zrv-anim-subir text-[clamp(1.3rem,2.3vw,2.1rem)] leading-[1.3] text-[var(--zrv-stone-700)] md:col-span-7 md:col-start-6">
          {CIUDAD.texto}
        </p>
      </div>
    </section>
  );
}
