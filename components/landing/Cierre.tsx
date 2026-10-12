import { Casillas } from "@/components/brand/Casillas";
import { ButtonLink } from "@/components/primitives/Button";
import { CARTA, CIERRE } from "@/lib/content";
import { ANCHO } from "./Marca";

/**
 * Cierre. Las mismas trece casillas del acto IV, pero ahora solo se llena
 * una: la tuya. Es la diferencia entre ver la promesa y empezarla.
 */
export function Cierre() {
  return (
    <section aria-labelledby="cierre-titulo" className="zrv-grain border-b border-[var(--zrv-espresso-600)] bg-espresso text-cream">
      <div className={`${ANCHO} flex flex-col items-center py-24 text-center md:py-36`}>
        <Casillas
          total={CARTA.length}
          llenas={1}
          etiqueta={`Una casilla de ${CARTA.length} completa: tu primer café`}
          className="justify-center"
          claseBorde="border-[var(--zrv-espresso-500)]"
          claseRelleno="bg-venus"
          claseVaso="text-espresso-deep"
        />
        <h2
          id="cierre-titulo"
          className="zrv-display zrv-anim-subir mt-12 max-w-[13ch] text-[clamp(3rem,9.6vw,9rem)] leading-[0.84]"
        >
          {CIERRE.titulo}
        </h2>
        <p className="zrv-anim-subir mt-6 max-w-[40ch] text-lg leading-relaxed text-cream/85">{CIERRE.texto}</p>
        <div className="zrv-anim-subir mt-10">
          <ButtonLink href="/join" variant="accent" size="lg">
            Sumate al Club
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
