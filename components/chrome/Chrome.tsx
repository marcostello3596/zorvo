"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";

import { Svg } from "@/components/Svg";
import { gsap, ScrollTrigger } from "@/lib/zorvo/gsap.js";

type Nav = { go: (href: string) => void };
const NavCtx = createContext<Nav>({ go: () => {} });
/** Navegar con la cortina negra (landing ↔ club). */
export const useCurtainNav = () => useContext(NavCtx);

/**
 * Todo lo que vive por encima de las páginas: topbar, cortina de transición,
 * cursor, scroll suave en desktop y los contenedores de toast y confetti.
 */
export function Chrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const arrived = useRef<(() => void) | null>(null);
  const lenisRef = useRef<{ scrollTo: (y: number, o?: object) => void; destroy: () => void } | null>(null);

  // ---------- llegada a una ruta nueva: avisa a la cortina y vuelve arriba
  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  // ---------- cortina
  const go = useCallback(
    (href: string) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const curtain = curtainRef.current;
      if (busy.current) return;
      if (reduced || !curtain || href === pathname) {
        router.push(href);
        return;
      }
      busy.current = true;
      const path = curtain.querySelector<SVGPathElement>(".curtain__path")!;
      const mascot = curtain.querySelector<HTMLElement>(".curtain__mascot")!;
      const shape = { t: 0 };
      const BULGE = 18;
      const draw = (out: boolean) => () => {
        const y = 100 - 100 * shape.t;
        const c = Math.sin(shape.t * Math.PI) * BULGE;
        path.setAttribute("d", out ? `M0 0 L0 ${y} Q50 ${y - c} 100 ${y} L100 0 Z` : `M0 100 L0 ${y} Q50 ${y - c} 100 ${y} L100 100 Z`);
      };
      curtain.style.visibility = "visible";
      curtain.classList.add("is-active");

      const reveal = () =>
        gsap.timeline({
          delay: 0.15,
          onComplete: () => {
            busy.current = false;
            curtain.style.visibility = "hidden";
            curtain.classList.remove("is-active");
            path.setAttribute("d", "M0 100 L100 100 Z");
            ScrollTrigger.refresh();
          },
        })
          .fromTo(shape, { t: 0 }, { t: 1, duration: 0.8, ease: "power3.inOut", onUpdate: draw(true) })
          .to(mascot, { y: -90, opacity: 0, duration: 0.45, ease: "power2.in" }, 0);

      gsap.timeline()
        .fromTo(shape, { t: 0 }, { t: 1, duration: 0.62, ease: "power3.inOut", onUpdate: draw(false) })
        .fromTo(mascot, { opacity: 0, scale: 0.5, rotation: -25, y: 40 }, { opacity: 1, scale: 1, rotation: 0, y: 0, duration: 0.5, ease: "back.out(2.2)" }, "-=0.2")
        .add(() => {
          const timeout = setTimeout(() => { arrived.current = null; reveal(); }, 5000);
          arrived.current = () => { clearTimeout(timeout); requestAnimationFrame(() => reveal()); };
          router.push(href);
        });
    },
    [pathname, router],
  );

  // ---------- links con data-curtain
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-curtain]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      e.preventDefault();
      go(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [go]);

  // ---------- scroll suave (solo mouse), cursor y topbar con fondo
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("js");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced) html.classList.add("reduced");
    const cleanups: (() => void)[] = [];

    if (!reduced && fine) {
      import("lenis").then(({ default: Lenis }) => {
        const lenis = new Lenis({ lerp: 0.11 });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (t: number) => lenis.raf(t * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        lenisRef.current = lenis;
        cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); lenisRef.current = null; });
      });

      const cur = document.querySelector<HTMLElement>(".cursor")!;
      const lab = cur.querySelector<HTMLElement>(".cursor__label")!;
      html.classList.add("has-cursor");
      const qx = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3.out" });
      const qy = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        qx(e.clientX);
        qy(e.clientY);
        const el = e.target as HTMLElement;
        const t = el.closest?.<HTMLElement>("[data-cursor]");
        const txt = t?.dataset.cursor ?? "";
        if (lab.textContent !== txt) lab.textContent = txt;
        cur.classList.toggle("is-label", !!txt);
        cur.classList.toggle("is-link", !txt && !!el.closest?.("a, button, input, label, select"));
      };
      const out = () => cur.classList.add("is-out");
      const inn = () => cur.classList.remove("is-out");
      window.addEventListener("pointermove", move);
      document.addEventListener("pointerleave", out);
      document.addEventListener("pointerenter", inn);
      cleanups.push(() => {
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerleave", out);
        document.removeEventListener("pointerenter", inn);
        html.classList.remove("has-cursor");
      });
    }

    const topbar = document.getElementById("topbar");
    let last = -1;
    const tick = () => {
      const y = window.scrollY;
      if ((y > 12) !== (last > 12)) topbar?.classList.toggle("is-scrolled", y > 12);
      last = y;
    };
    gsap.ticker.add(tick);
    cleanups.push(() => gsap.ticker.remove(tick));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <NavCtx.Provider value={{ go }}>
      <div className="cursor" aria-hidden="true"><span className="cursor__label" /></div>
      <div className="curtain" ref={curtainRef} aria-hidden="true">
        <svg className="curtain__svg" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <path className="curtain__path" d="M0 100 L100 100 Z" />
        </svg>
        <Svg name="mascot" className="curtain__mascot" />
      </div>
      <Topbar pathname={pathname} />
      {children}
      <div className="toast" data-toast role="status" aria-live="polite" hidden />
      <div className="confetti" data-confetti aria-hidden="true" />
    </NavCtx.Provider>
  );
}

function Topbar({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/admin")) return null;
  const onLanding = pathname === "/";
  const inClub = pathname.startsWith("/club");
  return (
    <header className={`topbar${onLanding ? "" : " show-logo"}`} id="topbar">
      <a className="topbar__logo" href="/" data-curtain="" aria-label="ZORVO, ir al inicio">
        <Svg name="logo" />
      </a>
      <nav className="topbar__nav" aria-label="Principal">
        <a className="pill pill--ink topbar__cta" href={inClub ? "/" : "/club"} data-curtain="">
          <Svg name="zsolid" className="pill__z" />
          <span>{inClub ? "Inicio" : "Mi tarjeta"}</span>
        </a>
      </nav>
    </header>
  );
}
