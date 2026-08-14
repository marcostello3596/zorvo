/**
 * Título de sección con las letras apiladas en vertical.
 * Es el recurso estructural que tomamos de la referencia, pero acá va en
 * Sofia Sans Extra Condensed (fuente real de Zorvo) y en columna angosta,
 * para que en mobile ocupe el margen y no una pantalla entera.
 *
 * Accesibilidad: la palabra completa va en un h2 sr-only. Las letras sueltas
 * son decorativas y quedan ocultas al lector de pantalla — si no, se leería
 * "e ele ce ele u be".
 */
export function StackedLabel({
  text,
  id,
  className = "",
  as: Tag = "h2",
}: {
  text: string;
  id?: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const letters = text.toUpperCase().split("");
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <Tag id={id} className="sr-only">
        {text}
      </Tag>
      <div
        aria-hidden="true"
        className="zrv-display flex flex-col text-[clamp(1.5rem,6vw,2.5rem)] leading-[0.82] tracking-[0.08em] opacity-95"
      >
        {letters.map((l, i) => (
          <span key={i} className={l === " " ? "h-[0.45em]" : undefined}>
            {l === " " ? "" : l}
          </span>
        ))}
      </div>
    </div>
  );
}
