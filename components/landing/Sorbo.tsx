import { ZorvoCup } from "@/components/brand";
import { Llenable } from "@/components/brand/Llenable";
import { NO_SOMOS, SI_SOMOS, SORBO } from "@/lib/content";
import { ANCHO, Marca } from "./Marca";

/**
 * Acto II — el sorbo. El centro emocional de la página.
 * El vaso se llena mientras se lee; de ese gesto viene el nombre.
 */
export function Sorbo() {
  return (
    <section id="la-idea" aria-labelledby="sorbo-titulo" className="zrv-grain scroll-mt-14 bg-olive text-cream">
      <div className={`${ANCHO} flex flex-col items-center pb-16 pt-24 text-center md:pb-24 md:pt-36`}>
        <Marca n="02" texto={SORBO.marca} className="text-venus" />

        <Llenable
          Ilustracion={ZorvoCup}
          titulo="Vaso de Zorvo llenándose"
          className="mt-12 h-[clamp(13rem,40vh,25rem)]"
          claseBase="text-[var(--zrv-olive-600)]"
          claseLleno="text-venus"
        />

        <h2
          id="sorbo-titulo"
          className="zrv-display zrv-anim-subir mt-12 text-[clamp(4.5rem,17vw,15rem)] leading-[0.8] text-venus"
        >
          {SORBO.titulo}
        </h2>

        <div className="mt-10 max-w-[40ch] space-y-5 text-lg leading-relaxed text-cream/90 md:text-xl">
          {SORBO.texto.map((p) => (
            <p key={p} className="zrv-anim-subir">{p}</p>
          ))}
        </div>

        <p className="zrv-label zrv-anim-subir mt-10 text-venus">{SORBO.firma}</p>
      </div>

      {/* Qué sí / qué no — está literal en el PDF de marca. */}
      <div className={`${ANCHO} pb-24 md:pb-32`}>
        <div className="grid border-t border-[var(--zrv-olive-500)] md:grid-cols-2">
          <div className="zrv-anim-subir border-b border-[var(--zrv-olive-500)] py-8 md:border-b-0 md:border-r md:pr-10">
            <h3 className="zrv-label mb-5 text-venus">Qué sí somos</h3>
            <ul className="zrv-display space-y-1 text-[clamp(1.6rem,3.2vw,2.75rem)] leading-[1.05]">
              {SI_SOMOS.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div className="zrv-anim-subir py-8 md:pl-10">
            <h3 className="zrv-label mb-5 text-[var(--zrv-olive-200)]">Qué no somos</h3>
            <ul className="zrv-display space-y-1 text-[clamp(1.6rem,3.2vw,2.75rem)] leading-[1.05] text-cream/55">
              {NO_SOMOS.map((x) => (
                <li key={x} className="line-through decoration-[var(--zrv-olive-400)] decoration-2">{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
