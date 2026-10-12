"use client";

import { useLayoutEffect } from "react";

import { gsap, ScrollTrigger } from "@/lib/zorvo/gsap.js";
import { initLanding } from "@/lib/zorvo/landing.js";

const VISTO = "zrv-loader-visto";

/** Le da vida a la landing que llega armada del servidor. */
export function LandingClient() {
  useLayoutEffect(() => {
    const root = document.getElementById("view-landing");
    const loader = document.getElementById("loader");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let yaVisto = false;
    try { yaVisto = sessionStorage.getItem(VISTO) === "1"; } catch { /* sin storage */ }

    // El preloader solo la primera vez de la sesión; volviendo del club, no.
    // (se oculta, no se borra: el nodo es de React)
    if (loader && (reduced || yaVisto)) loader.hidden = true;

    const landing = initLanding({ root, reduced });
    const glReady = landing.startGL();
    let cancelled = false;

    (async () => {
      if (!loader || loader.hidden) {
        await glReady.catch(() => null);
        if (!cancelled) {
          landing.intro();
          ScrollTrigger.refresh();
        }
        return;
      }
      const count = loader.querySelector<HTMLElement>("[data-loader-count]")!;
      const fills = [...loader.querySelectorAll<SVGElement>(".zslot__ink")];
      const n = { v: 0 };
      const tl = gsap.timeline();
      tl.to(n, { v: 10, duration: 1.1, ease: "power2.inOut", onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(2, "0"); } }, 0);
      fills.forEach((f, i) => {
        tl.fromTo(f, { opacity: 0, scale: 1.7, rotation: gsap.utils.random(-24, 6), transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, rotation: gsap.utils.random(-10, 8), duration: 0.16, ease: "power3.in", immediateRender: true }, 0.05 + i * 0.1)
          .fromTo(f.closest(".zslot"), { scale: 1.15 }, { scale: 1, duration: 0.35, ease: "elastic.out(1, .5)" }, ">");
      });
      await Promise.all([tl, glReady.catch(() => null), document.fonts?.ready?.catch(() => null)]);
      if (cancelled) return;
      await gsap.timeline()
        .to(loader.querySelector(".loader__inner"), { y: -40, opacity: 0, duration: 0.4, ease: "power2.in" })
        .to(loader, { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, "-=0.1")
        .add(() => { if (!cancelled) landing.intro(); }, "-=0.55");
      loader.hidden = true;
      try { sessionStorage.setItem(VISTO, "1"); } catch { /* sin storage */ }
      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      landing.destroy();
    };
  }, []);

  return null;
}
