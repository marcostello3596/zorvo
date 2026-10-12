"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Svg, type SvgName } from "@/components/Svg";

export function AdminNav({ equipo }: { equipo: boolean }) {
  const pathname = usePathname();
  const links: { href: string; label: string; ico: SvgName }[] = [
    { href: "/admin", label: "Mostrador", ico: "scanico" },
    { href: "/admin/clientes", label: "Clientes", ico: "usersico" },
    ...(equipo ? [{ href: "/admin/equipo", label: "Equipo", ico: "cardico" as SvgName }] : []),
  ];
  return (
    <nav className="adm-nav" aria-label="Mostrador">
      {links.map((l) => {
        const on = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`adm-nav__item${on ? " is-active" : ""}`} aria-current={on ? "page" : undefined}>
            <Svg name={l.ico} className="adm-nav__ico" />
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
