import { ZorvoCup } from "@/components/brand";
import { Casillas } from "@/components/brand/Casillas";
import { CARTA, COLECCION } from "@/lib/content";
import { ANCHO, Marca } from "./Marca";

/**
 * Acto IV — la carta como colección.
 * Las trece casillas se completan una por una al pasar: la gorra, hecha
 * visible. Después, la carta como lista tipográfica: una fila por café, a
 * todo el ancho. Reemplaza la grilla de tres columnas, que con trece cafés
 * dejaba una celda vacía.
 */
export function Coleccion() {
  return (
    <section id="la-carta" aria-labelledby="carta-titulo" className="scroll-mt-14 bg-cream text-ink">
      <div className={`${ANCHO} py-20 md:py-32`}>
        <Marca n="04" texto={COLECCION.marca} className="text-espresso" />

        <div className="mt-6 grid gap-10 md:grid-cols-12 md:items-end md:gap-12">
          <h2
            id="carta-titulo"
            className="zrv-display zrv-anim-subir text-[clamp(3rem,8.6vw,8.5rem)] leading-[0.85] text-espresso md:col-span-7"
          >
            {COLECCION.titulo}
          </h2>
          <div className="md:col-span-5">
            <Casillas
              total={CARTA.length}
              etiqueta={`${CARTA.length} casillas, una por cada café de la carta`}
              claseBorde="border-espresso"
              claseRelleno="bg-espresso"
              claseVaso="text-venus"
            />
            <p className="zrv-anim-subir mt-5 text-lg leading-snug md:text-xl">
              {COLECCION.promesa}
              <span className="mt-1 block text-sm text-[var(--zrv-stone-700)]">{COLECCION.nota}</span>
            </p>
          </div>
        </div>

        <ol className="mt-16 border-b border-[var(--zrv-espresso-700)]/25 md:mt-24">
          {CARTA.map((cafe, i) => (
            <li
              key={cafe.slug}
              style={{ ["--i" as string]: i % 4 }}
              className="zrv-fila zrv-anim-subir border-t border-[var(--zrv-espresso-700)]/25"
            >
              <div className="grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-3 px-1 py-4 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_7rem] md:gap-x-6 md:px-3 md:py-6">
                <span className="zrv-data col-start-1 row-start-1 text-xs opacity-75">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="zrv-display col-start-2 row-start-1 flex items-center gap-3 text-[clamp(1.9rem,4.8vw,4.5rem)] leading-none">
                  {cafe.nombre}
                  <ZorvoCup className="zrv-fila-vaso zrv-fila-acento hidden h-[0.55em] w-auto shrink-0 md:block" title="" />
                </h3>
                <p className="col-span-2 col-start-2 row-start-2 mt-2 text-sm leading-snug opacity-75 md:col-span-1 md:col-start-3 md:row-start-1 md:mt-0 md:text-base">
                  {cafe.nota}
                </p>
                <span className="zrv-label zrv-fila-acento col-start-3 row-start-1 text-right text-espresso md:col-start-4">
                  {cafe.familia}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
