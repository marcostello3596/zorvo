import type { CSSProperties } from "react";

import { Svg } from "@/components/Svg";
import { badge as badgeSvg, zSlot } from "@/lib/zorvo/svg.js";

/** Variables CSS en línea (--x: ...) con tipos. */
export function vars(v: Record<string, string | number>): CSSProperties {
  return Object.fromEntries(Object.entries(v).map(([k, val]) => [`--${k}`, val])) as CSSProperties;
}

type ZstProps = { t?: string; b?: string; l?: string; rr?: string; s: string; rot: string; speed?: number; hero?: boolean };

/** Sticker de la Z: flota y se inclina con el scroll; al tocarlo da una vuelta. */
export function Zst({ t = "auto", b = "auto", l = "auto", rr = "auto", s, rot, speed = 0.5, hero }: ZstProps) {
  return (
    <span className={`zst${hero ? " zst--hero" : ""}`} style={vars({ t, b, l, rr, s, rot })} data-speed={speed} aria-hidden="true">
      <Svg name="zsticker" className="zst__in" />
    </span>
  );
}

export function Badge({ id, dark = false, className }: { id: string; dark?: boolean; className?: string }) {
  return <Svg html={badgeSvg({ id, dark })} className={className} />;
}

export function ZGrid({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: Array.from({ length: n }, () => `<span class="zslot">${zSlot()}</span>`).join("") }}
    />
  );
}

export function Band({ items, dir }: { items: string[]; dir: 1 | -1 }) {
  const seq = [...items, ...items];
  const one = (key: string) => (
    <span className="band__seq" key={key}>
      {seq.map((t, i) => (
        <span key={i} style={{ display: "contents" }}>
          <span>{t}</span>
          <Svg name="zsolid" className="band__z" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="band__track" data-band={dir}>
      {one("a")}
      {one("b")}
    </div>
  );
}

export function WalletButton({ href = "/join" }: { href?: string }) {
  return (
    <a className="btn-wallet" href={href} data-curtain="">
      <Svg name="wallet" className="btn-wallet__icon" />
      <span className="btn-wallet__txt">
        <small>Agregar a</small>Apple Wallet
      </span>
    </a>
  );
}
