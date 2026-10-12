import { ZorvoWalk, ZorvoWordmark } from "@/components/brand";
import { Llenable } from "@/components/brand/Llenable";
import { ButtonLink } from "@/components/primitives/Button";
import { HERO, SITE } from "@/lib/content";
import { ANCHO } from "./Marca";

const retraso = (s: number) => ({ ["--retraso" as string]: `${s}s` });

/**
 * Apertura. La persona que camina es la protagonista de toda la página: acá
 * aparece llenándose por primera vez, parada sobre el logotipo.
 *
 * Todo lo de esta pantalla se anima al CARGAR, no al hacer scroll: es lo
 * primero que se ve, y esperar a que alguien baje para mostrarlo sería
 * esconderlo.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="zrv-grain relative flex min-h-[calc(100svh-5.75rem)] flex-col overflow-hidden bg-espresso text-cream"
    >
      <div className={`${ANCHO} pt-8 md:pt-12`}>
        <p className="zrv-label zrv-carga-subir flex flex-wrap justify-between gap-2 text-venus" style={retraso(0.05)}>
          <span>{SITE.bajada}</span>
          <span>{HERO.lugar} — {SITE.desde}</span>
        </p>

        {/* Cuatro líneas en el teléfono, dos en desktop: en pantalla ancha,
            cuatro renglones de este tamaño empujan el logotipo fuera de vista. */}
        <h1
          id="hero-titulo"
          className="zrv-display mt-8 text-[clamp(3.4rem,6.4vw,7.25rem)] leading-[0.86] md:mt-10"
        >
          {HERO.titulo.map((linea, i) => (
            <span key={linea}>
              <span className="zrv-carga-subir block md:inline-block" style={retraso(0.12 + i * 0.09)}>
                {i === HERO.titulo.length - 1 ? <span className="text-venus">{linea}</span> : linea}
              </span>
              {i % 2 === 0 ? <span className="hidden md:inline"> </span> : <br className="hidden md:inline" />}
            </span>
          ))}
        </h1>

        <p className="zrv-carga-subir mt-6 max-w-[34ch] text-base leading-relaxed text-cream/85 md:text-lg" style={retraso(0.55)}>
          {HERO.bajada}
        </p>

        <div className="zrv-carga-subir mt-8 flex flex-wrap gap-3" style={retraso(0.65)}>
          <ButtonLink href="/join" variant="accent" size="lg">
            Sumate al Club
          </ButtonLink>
          <ButtonLink href="#la-carta" variant="outline" size="lg" className="text-cream">
            Ver la carta
          </ButtonLink>
        </div>
      </div>

      <div className={`${ANCHO} relative mt-auto pt-14 md:pt-10`}>
        <div className="relative">
          {/* De pie sobre el logotipo, con los pies apenas dentro de las letras.
              El posicionamiento va en un envoltorio: Llenable necesita ser
              "relative" para apilar sus dos capas. */}
          <div className="zrv-anim-seguir absolute bottom-[86%] right-[2%] z-10 h-36 md:bottom-[90%] md:h-[clamp(13rem,33vh,22rem)]">
            <Llenable
              modo="carga"
              Ilustracion={ZorvoWalk}
              titulo="Persona caminando con un café Zorvo en la mano"
              className="h-full"
              claseBase="text-[var(--zrv-espresso-600)]"
              claseLleno="text-cream"
            />
          </div>
          <ZorvoWordmark className="zrv-carga-asomar relative block h-auto w-full text-venus" title="ZORVO" />
        </div>
      </div>
    </section>
  );
}
