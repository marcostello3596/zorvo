import { Svg } from "@/components/Svg";

/** Las Z del socio en una fila, para que el barista lo vea de un vistazo. */
export function MiniTarjeta({ z, target }: { z: number; target: number }) {
  return (
    <div className="mini" role="img" aria-label={`${z} de ${target} Z`}>
      {Array.from({ length: target }, (_, i) => (
        <Svg key={i} name="zsolid" className={`mini__z${i < z ? " is-on" : ""}`} />
      ))}
    </div>
  );
}
