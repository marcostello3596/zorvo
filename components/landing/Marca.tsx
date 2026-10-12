/** Marcador de acto: número mono + filete + nombre. La voz de "01 / 02 / 03" del PDF. */
export function Marca({ n, texto, className = "" }: { n: string; texto: string; className?: string }) {
  return (
    <p className={`zrv-label zrv-anim-subir flex items-center gap-3 ${className}`}>
      <span className="zrv-data">{n}</span>
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-60" />
      {texto}
    </p>
  );
}

/** Contenedor horizontal común a todos los actos. */
export const ANCHO = "mx-auto w-full max-w-[90rem] px-5 md:px-10";
