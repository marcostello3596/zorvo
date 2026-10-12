import type { HTMLAttributes } from "react";

import { SVG } from "@/lib/zorvo/svg.js";

export type SvgName = keyof typeof SVG;

type Props = HTMLAttributes<HTMLSpanElement> & {
  /** Nombre del asset (logo, mascot, walker, zsolid…) */
  name?: SvgName;
  /** Markup SVG ya armado (badge, zSlot…), en lugar de `name` */
  html?: string;
  /** Si el gráfico comunica algo, su texto alternativo. Sin label es decorativo. */
  label?: string;
  [key: `data-${string}`]: string | undefined;
};

/**
 * Inserta un SVG de marca en el HTML del servidor: se ve aunque el JS no haya
 * cargado y no hay un salto cuando hidrata.
 */
export function Svg({ name, html, label, ...rest }: Props) {
  const markup = html ?? (name ? SVG[name] : "");
  return (
    <span
      data-svg={name ?? "custom"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markup }}
      {...rest}
    />
  );
}
