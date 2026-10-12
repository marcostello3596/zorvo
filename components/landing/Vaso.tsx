import { ZorvoCup } from "@/components/brand";

/**
 * El vaso de la esquina: se llena con el scroll de toda la página.
 * Es el indicador de progreso, pero dicho en el idioma de la marca.
 *
 * Solo desktop: en el teléfono taparía contenido. Decorativo (aria-hidden).
 * Si el navegador no soporta scroll(), o el usuario pidió menos movimiento,
 * no se muestra: un vaso quieto no indica nada.
 */
export function Vaso() {
  return (
    <div
      aria-hidden="true"
      className="zrv-vaso-chip pointer-events-none fixed bottom-6 right-6 z-30 hidden h-16 w-16 items-center justify-center border-2 border-espresso bg-cream md:flex"
    >
      <div className="zrv-vaso relative inline-block h-9">
        <ZorvoCup className="block h-full w-auto text-[var(--zrv-stone-300)]" title="" />
        <div className="zrv-llenado absolute inset-0 text-espresso">
          <ZorvoCup className="block h-full w-auto" title="" />
        </div>
      </div>
    </div>
  );
}
