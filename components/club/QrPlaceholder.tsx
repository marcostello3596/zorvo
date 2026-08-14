/**
 * QR decorativo — SOLO maqueta.
 * El real se genera en el cliente cada 30s con HMAC (ver ZORVO_02 §6).
 * Determinístico a partir de una semilla para que no parpadee entre renders.
 */
export function QrPlaceholder({
  className = "",
  seed = 7,
}: {
  className?: string;
  seed?: number;
}) {
  const N = 25;
  const cells: boolean[] = [];
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < N * N; i++) cells.push(rand() > 0.52);

  const isFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);

  return (
    <svg
      viewBox={`0 0 ${N} ${N}`}
      className={className}
      role="img"
      aria-label="Código QR de tu credencial Zorvo"
      shapeRendering="crispEdges"
    >
      <rect width={N} height={N} fill="var(--zrv-cream)" />
      <g fill="var(--zrv-espresso-950)">
        {cells.map((on, i) => {
          const x = i % N;
          const y = Math.floor(i / N);
          if (isFinder(x, y) || !on) return null;
          return <rect key={i} x={x} y={y} width={1} height={1} />;
        })}
        {[
          [0, 0],
          [N - 7, 0],
          [0, N - 7],
        ].map(([fx, fy]) => (
          <g key={`${fx}-${fy}`}>
            <rect x={fx} y={fy} width={7} height={7} />
            <rect
              x={(fx as number) + 1}
              y={(fy as number) + 1}
              width={5}
              height={5}
              fill="var(--zrv-cream)"
            />
            <rect
              x={(fx as number) + 2}
              y={(fy as number) + 2}
              width={3}
              height={3}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
