"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DESTINOS = [
  { href: "/club", label: "Inicio" },
  { href: "/club/carta", label: "La carta" },
  { href: "/club/recorridos", label: "Recorridos" },
  { href: "/club/card", label: "Credencial" },
];

/**
 * Navegación inferior del Club — 4 destinos, altura táctil 56px.
 * Se usa parado, con una mano, con la otra ocupada.
 */
export function ClubNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegación del Club"
      className="sticky bottom-0 z-30 border-t border-hairline bg-cream"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-[30rem] grid-cols-4">
        {DESTINOS.map((d) => {
          const activo = path === d.href;
          return (
            <li key={d.href}>
              <Link
                href={d.href}
                aria-current={activo ? "page" : undefined}
                className={`zrv-label flex h-14 items-center justify-center border-t-2 text-center transition-colors ${
                  activo
                    ? "border-espresso text-espresso"
                    : "border-transparent text-[var(--zrv-stone-500)]"
                }`}
              >
                {d.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
