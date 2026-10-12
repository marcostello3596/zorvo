import { ZorvoCup } from "./ZorvoCup";

/**
 * Las casillas del recorrido: la colección hecha objeto.
 *
 * modo="scroll": se completan una por una mientras la fila cruza la pantalla.
 * modo="carga":  se completan una por una al abrir la página.
 *
 * `llenas` controla cuántas se llenan; el resto queda vacío a propósito.
 * En la landing se llenan todas (es la promesa); en /join, ninguna queda
 * "regalada" — el visitante todavía no tomó nada.
 */
export function Casillas({
  total,
  llenas = total,
  modo = "scroll",
  className = "",
  claseBorde,
  claseRelleno,
  claseVaso,
  etiqueta,
}: {
  total: number;
  llenas?: number;
  modo?: "scroll" | "carga";
  className?: string;
  claseBorde: string;
  claseRelleno: string;
  claseVaso: string;
  etiqueta: string;
}) {
  const contenedor = modo === "carga" ? "zrv-carga-casillas" : "zrv-anim-casillas";
  return (
    <div role="img" aria-label={etiqueta} className={`flex flex-wrap gap-1.5 md:gap-2 ${contenedor} ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ ["--i" as string]: i }}
          className={`zrv-casilla relative block aspect-square w-[clamp(2rem,6.4vw,3.75rem)] overflow-hidden border ${claseBorde}`}
        >
          {i < llenas && (
            <span className={`zrv-casilla-relleno flex items-center justify-center ${claseRelleno}`}>
              <ZorvoCup className={`h-[45%] w-auto ${claseVaso}`} title="" />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
