import type { ReactNode } from "react";

/**
 * Ticker de texto en loop. Se pausa al hover y respeta prefers-reduced-motion.
 * El contenido se duplica para que el bucle no tenga costura; la copia
 * duplicada va aria-hidden para no repetirla en un lector de pantalla.
 */
export function Marquee({
  children,
  seconds = 30,
  className = "",
  repeat = 4,
  reverse = false,
}: {
  children: ReactNode;
  seconds?: number;
  className?: string;
  repeat?: number;
  /** Corre hacia el otro lado. Dos filas en sentidos opuestos = la ciudad. */
  reverse?: boolean;
}) {
  const items = Array.from({ length: repeat });
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ ["--marquee-duration" as string]: `${seconds}s` }}
    >
      <div className={`zrv-marquee-track ${reverse ? "zrv-marquee-track--reverse" : ""}`}>
        <div className="flex shrink-0">
          {items.map((_, i) => (
            <span key={i} className="flex items-center">
              {children}
            </span>
          ))}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {items.map((_, i) => (
            <span key={i} className="flex items-center">
              {children}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
