import { ZorvoBarista, ZorvoCup, ZorvoWalk } from "@/components/brand";
import { Llenable } from "@/components/brand/Llenable";
import { Marquee } from "@/components/brand/Marquee";
import { ButtonLink } from "@/components/primitives/Button";
import { CLUB, RITUAL } from "@/lib/content";
import { ANCHO, Marca } from "./Marca";

const ILUSTRACIONES = {
  walk: { Ilustracion: ZorvoWalk, titulo: "Persona llegando a Zorvo" },
  cup: { Ilustracion: ZorvoCup, titulo: "Vaso de Zorvo" },
  barista: { Ilustracion: ZorvoBarista, titulo: "Barista de Zorvo sirviendo un café" },
} as const;

/**
 * Franja amarilla entre el sorbo (olive) y el Club (espresso).
 * No es decorativa: Espresso y Olive nunca se tocan (1.07:1 de contraste
 * entre sí, se funden en un bloque marrón). Algo tiene que mediar.
 */
export function FranjaRitual() {
  return (
    <div aria-hidden="true">
      <Marquee seconds={30} className="bg-venus text-espresso-deep">
        {RITUAL.map((p) => (
          <span key={p.n} className="flex items-center whitespace-nowrap py-3 md:py-4">
            <span className="zrv-data px-4 text-xs opacity-60">{p.n}</span>
            <span className="zrv-display pr-4 text-2xl md:text-3xl">{p.titulo}</span>
            <ZorvoCup className="h-6 w-auto shrink-0" title="" />
            <span className="pr-8" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

/**
 * Acto III — el Club como ritual de tres pasos.
 * Cada ilustración se llena cuando su paso llega a la pantalla. En desktop
 * se alternan izquierda/derecha; en el teléfono se apilan. No hay secciones
 * "pegajosas" de 300vh: secuestrar el scroll en un celular es la forma más
 * rápida de que alguien se vaya.
 */
export function Club() {
  return (
    <section id="el-club" aria-labelledby="club-titulo" className="zrv-grain scroll-mt-14 bg-espresso text-cream">
      <div className={`${ANCHO} py-20 md:py-32`}>
        <Marca n="03" texto={CLUB.marca} className="text-venus" />
        <h2
          id="club-titulo"
          className="zrv-display zrv-anim-subir mt-6 text-[clamp(2.75rem,8vw,7.75rem)] leading-[0.86]"
        >
          <span className="block">Tomás café.</span>
          <span className="block">Nos acordamos.</span>
          <span className="block text-venus">Te llevás una gorra.</span>
        </h2>
        <p className="zrv-anim-subir mt-8 max-w-[46ch] text-lg leading-relaxed text-cream/85 md:text-xl">
          {CLUB.texto}
        </p>

        <ol className="mt-20 space-y-20 md:mt-28 md:space-y-28">
          {RITUAL.map((paso, i) => {
            const { Ilustracion, titulo } = ILUSTRACIONES[paso.icono];
            const derecha = i % 2 === 1;
            return (
              <li key={paso.n} className="grid items-center gap-8 md:grid-cols-12 md:gap-10">
                <div
                  className={`flex justify-center md:col-span-6 ${
                    derecha ? "md:order-2 md:col-start-7 md:justify-start" : "md:justify-end"
                  }`}
                >
                  <Llenable
                    Ilustracion={Ilustracion}
                    titulo={titulo}
                    className="h-[clamp(12rem,38vh,23rem)]"
                    claseBase="text-[var(--zrv-espresso-600)]"
                    claseLleno="text-venus"
                  />
                </div>
                <div
                  className={`md:col-span-5 ${
                    derecha ? "md:order-1 md:col-start-1 md:text-right" : "md:col-start-8"
                  }`}
                >
                  <span className="zrv-data zrv-anim-subir block text-[clamp(3rem,7vw,6rem)] leading-none text-venus">
                    {paso.n}
                  </span>
                  <h3 className="zrv-display zrv-anim-subir mt-4 text-[clamp(2.25rem,4.8vw,4.25rem)] leading-[0.9]">
                    {paso.titulo}
                  </h3>
                  <p
                    className={`zrv-anim-subir mt-4 max-w-[32ch] text-lg leading-relaxed text-cream/80 ${
                      derecha ? "md:ml-auto" : ""
                    }`}
                  >
                    {paso.texto}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="zrv-anim-subir mt-20 flex justify-center md:mt-28">
          <ButtonLink href="/join" variant="accent" size="lg">
            Sumate al Club
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
