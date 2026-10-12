import type { ComponentType } from "react";

type Ilustracion = ComponentType<{ className?: string; title?: string }>;

/**
 * Una ilustración de marca que se llena de café.
 *
 * Son dos copias del mismo trazo apiladas: abajo la silueta en un tono
 * apagado, arriba la versión a color recortada desde arriba. Al animar
 * --llenado de 100% a 0%, el color sube como líquido en un vaso. Funciona
 * con los trazos rellenos que ya teníamos, sin redibujar nada.
 *
 * modo="scroll": se llena mientras pasa por la pantalla.
 * modo="carga":  se llena al abrir la página (para lo que ya está a la vista).
 *
 * Accesibilidad: la copia de arriba es decorativa y va aria-hidden; el
 * lector de pantalla anuncia una sola ilustración con su descripción.
 */
export function Llenable({
  Ilustracion,
  titulo,
  className = "",
  claseBase,
  claseLleno,
  modo = "scroll",
}: {
  Ilustracion: Ilustracion;
  titulo: string;
  className?: string;
  claseBase: string;
  claseLleno: string;
  modo?: "scroll" | "carga";
}) {
  const animacion = modo === "carga" ? "zrv-carga-llenar" : "zrv-anim-llenar";
  return (
    <div className={`relative inline-block ${animacion} ${className}`}>
      <Ilustracion className={`block h-full w-auto ${claseBase}`} title={titulo} />
      <div aria-hidden="true" className={`zrv-llenado absolute inset-0 ${claseLleno}`}>
        <Ilustracion className="block h-full w-auto" title="" />
      </div>
      <span aria-hidden="true" className={`zrv-menisco ${claseLleno}`} />
    </div>
  );
}
