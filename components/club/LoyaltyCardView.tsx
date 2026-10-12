"use client";

import { useLayoutEffect, useRef } from "react";

import { gsap } from "@/lib/zorvo/gsap.js";
import { createLoyaltyCard } from "@/lib/zorvo/loyalty-card.js";

type Props = {
  z: number;
  target: number;
  tarjetas: number;
  nombre: string;
  numero: string;
};

type Card = ReturnType<typeof createLoyaltyCard>;

/**
 * La tarjeta de la Z con datos reales. Cuando el servidor trae más Z que las
 * que se ven (el barista acaba de escanear), las sella una por una; si en el
 * medio se completó una tarjeta, la llena, la da vuelta para mostrar el café
 * de regalo y arranca la nueva.
 */
export function LoyaltyCardView({ z, target, tarjetas, nombre, numero }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const card = useRef<Card | null>(null);
  const prev = useRef({ z, tarjetas });
  const tl = useRef<gsap.core.Timeline | null>(null);

  // montar una sola vez
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = createLoyaltyCard({ stamps: prev.current.z, total: target, number: numero, name: nombre.split(" ")[0] });
    el.append(c.el);
    card.current = c;
    if (!reduced) {
      gsap.from(c.el, { rotationX: 40, y: 40, opacity: 0, duration: 1.1, ease: "expo.out", transformPerspective: 900, clearProps: "transform,opacity" });
    }
    return () => {
      tl.current?.kill();
      c.el.remove();
      card.current = null;
    };
    // la tarjeta se arma con los valores iniciales; los cambios los anima el efecto de abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, numero, nombre]);

  // animar diferencias
  useLayoutEffect(() => {
    const c = card.current;
    const antes = prev.current;
    prev.current = { z, tarjetas };
    if (!c || (antes.z === z && antes.tarjetas === tarjetas)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tl.current?.kill();

    if (reduced) {
      if (c.flipped) c.flip(false, { duration: 0 });
      c.setStamps(z);
      return;
    }

    const sellar = (t: gsap.core.Timeline, n: number) => {
      for (let i = 0; i < n; i++) t.add(() => { c.add(); }, i === 0 ? ">" : ">0.32");
    };

    const t = gsap.timeline({ delay: 0.25 });
    tl.current = t;
    const scrollToCard = () => {
      const r = c.el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) c.el.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    t.add(scrollToCard);

    if (tarjetas > antes.tarjetas) {
      // completar la tarjeta actual, mostrar el premio y empezar otra
      sellar(t, Math.max(0, target - c.count));
      t.add(() => { c.flip(true); }, ">0.5");
      t.add(() => {
        c.flip(false, { duration: 0.9 });
        c.setStamps(0);
      }, ">2.4");
      t.add(() => {}, ">0.9");
      sellar(t, z);
    } else if (z > antes.z) {
      sellar(t, z - c.count);
    } else {
      // anulación u otro ajuste: sin show, solo el estado correcto
      t.add(() => c.setStamps(z));
    }
  }, [z, tarjetas, target]);

  return <div className="app-card" ref={host} data-cursor="Inclinala" />;
}
