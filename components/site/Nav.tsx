"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ZorvoWordmark } from "@/components/brand";

const LINKS = [
  { href: "/#el-club", label: "El Club" },
  { href: "/#la-carta", label: "La carta" },
  { href: "/#la-idea", label: "La idea" },
  { href: "/#el-lugar", label: "El lugar" },
  { href: "/club", label: "Entrar" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // Bloquea el scroll del fondo y devuelve el foco al cerrar.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--zrv-espresso-600)] bg-espresso text-cream">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-4 md:px-8">
          <Link href="/" aria-label="Zorvo — inicio" className="block">
            <ZorvoWordmark className="h-5 w-auto text-venus" />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-7">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="zrv-label text-cream/85 transition-colors hover:text-venus"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <button
            ref={openRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className="zrv-label -mr-2 flex h-11 items-center px-2 text-cream md:hidden"
          >
            Menú
          </button>
        </div>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className="zrv-grain fixed inset-0 z-50 flex flex-col bg-espresso text-cream"
        >
          <div className="flex h-14 items-center justify-between border-b border-[var(--zrv-espresso-600)] px-4">
            <ZorvoWordmark className="h-5 w-auto text-venus" />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="zrv-label -mr-2 flex h-11 items-center px-2"
            >
              Cerrar
            </button>
          </div>

          <nav aria-label="Principal" className="flex-1 overflow-y-auto px-4 py-8">
            <ul className="flex flex-col">
              {LINKS.map((l, i) => (
                <li key={l.href} className="border-b border-[var(--zrv-espresso-600)]">
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="zrv-display flex items-baseline gap-4 py-5 text-[clamp(2.25rem,11vw,3.5rem)] text-cream transition-colors hover:text-venus"
                  >
                    <span className="zrv-data text-xs tracking-normal text-[var(--zrv-espresso-300)]">
                      0{i + 1}
                    </span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="zrv-label px-4 pb-8 text-[var(--zrv-espresso-300)]">
            Cool Brew Coffee — Est. 2026
          </p>
        </div>
      )}
    </>
  );
}
