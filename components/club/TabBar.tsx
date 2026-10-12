"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Svg, type SvgName } from "@/components/Svg";

const TABS: { href: string; label: string; ico: SvgName }[] = [
  { href: "/club", label: "Tarjeta", ico: "cardico" },
  { href: "/club/recorridos", label: "Recorridos", ico: "routeico" },
  { href: "/club/historial", label: "Historial", ico: "listico" },
];

export function TabBar({ onQr }: { onQr: () => void }) {
  const pathname = usePathname();
  const activo = (href: string) => (href === "/club" ? pathname === "/club" : pathname.startsWith(href));
  const item = (t: (typeof TABS)[number]) => (
    <Link key={t.href} href={t.href} className={`tabbar__item${activo(t.href) ? " is-active" : ""}`} aria-current={activo(t.href) ? "page" : undefined}>
      <Svg name={t.ico} className="tabbar__ico" />
      <span>{t.label}</span>
    </Link>
  );
  return (
    <nav className="tabbar tabbar--club" aria-label="Club">
      {item(TABS[0]!)}
      {item(TABS[1]!)}
      <button className="tabbar__qr" type="button" onClick={onQr} aria-label="Mostrar mi QR">
        <Svg name="qr" />
      </button>
      {item(TABS[2]!)}
      <Link href="/club/carta" className={`tabbar__item${pathname.startsWith("/club/carta") ? " is-active" : ""}`}>
        <Svg name="cup" className="tabbar__ico tabbar__ico--cup" />
        <span>Carta</span>
      </Link>
    </nav>
  );
}
