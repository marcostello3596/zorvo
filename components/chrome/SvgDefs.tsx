/** Filtros SVG compartidos: la textura de tinta de los sellos Z. */
export function SvgDefs() {
  return (
    <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="z-ink" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves={2} seed={4} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -9 0 0 0 6.2" result="speck" />
          <feComposite in="SourceGraphic" in2="speck" operator="in" result="tex" />
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={11} result="w" />
          <feDisplacementMap in="tex" in2="w" scale={6} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
