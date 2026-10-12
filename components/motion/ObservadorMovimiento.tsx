"use client";

import { useEffect } from "react";

/**
 * Respaldo para navegadores sin animation-timeline (hoy: Firefox).
 *
 * Uno solo por página, no un envoltorio por elemento: busca todo lo que tenga
 * una clase .zrv-anim-* y le agrega .zrv-visible cuando entra en pantalla.
 * Donde el navegador soporta animaciones ligadas al scroll, no hace nada —
 * el CSS ya resolvió todo sin JavaScript.
 *
 * El contenido nunca depende de este script: si no corre, el texto sigue en
 * el HTML y legible. Lo único que se pierde es la animación.
 */
export function ObservadorMovimiento() {
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()")) return;
    // Sin IntersectionObserver no activamos nada: el contenido queda en su
    // estado final, que es lo correcto.
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Recién ahora, con todo lo necesario disponible, se habilita el estado
    // inicial oculto. Ver html.zrv-mov en globals.css.
    document.documentElement.classList.add("zrv-mov");

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("zrv-visible");
          observador.unobserve(e.target); // una sola pasada
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.15 },
    );

    document.querySelectorAll("[class*='zrv-anim-']").forEach((el) => observador.observe(el));
    return () => {
      observador.disconnect();
      document.documentElement.classList.remove("zrv-mov");
    };
  }, []);

  return null;
}
