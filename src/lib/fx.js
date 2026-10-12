import { gsap } from 'gsap';
import { SVG } from './svg.js';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function haptic(ms = 10) {
  try { navigator.vibrate?.(ms); } catch { /* sin vibración */ }
}

/** Lluvia de Z (stickers) desde un punto de la pantalla. */
export function zConfetti(x, y, { count = 28 } = {}) {
  if (reducedMotion()) return;
  const host = document.querySelector('[data-confetti]');
  if (!host) return;
  const colors = ['#76262F', '#FFC744', '#161513', '#FFC744'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'confetti__z';
    p.innerHTML = i % 5 === 0 ? SVG.sparkle : SVG.zsticker;
    p.style.color = colors[i % colors.length];
    const s = gsap.utils.random(18, 38);
    Object.assign(p.style, { width: `${s}px`, left: `${x}px`, top: `${y}px` });
    host.appendChild(p);
    gsap.fromTo(p, { x: -s / 2, y: -s / 2, rotation: gsap.utils.random(-90, 90), scale: 0.2 }, {
      scale: 1,
      rotation: `+=${gsap.utils.random(-540, 540)}`,
      duration: gsap.utils.random(1.6, 2.4),
      ease: 'none',
      physics2D: { velocity: gsap.utils.random(420, 820), angle: gsap.utils.random(-125, -55), gravity: 1100 },
      onComplete: () => p.remove(),
    });
  }
}

let toastTimer;
export function toast(msg) {
  const el = document.querySelector('[data-toast]');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  gsap.killTweensOf(el);
  gsap.fromTo(el, { y: 24, opacity: 0, xPercent: -50 }, { y: 0, opacity: 1, xPercent: -50, duration: 0.45, ease: 'back.out(2)' });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    gsap.to(el, { y: 16, opacity: 0, duration: 0.3, onComplete: () => { el.hidden = true; } });
  }, 2800);
}

/** Un vaso que vuela en arco desde `from` hasta `to` (elementos). */
export function flyCup(from, to, { onArrive } = {}) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const cup = document.createElement('span');
  cup.className = 'fly-cup';
  cup.innerHTML = SVG.cup;
  document.body.appendChild(cup);
  const x0 = a.left + a.width / 2;
  const y0 = a.top + a.height / 2;
  const x1 = b.left + b.width / 2;
  const y1 = b.top + b.height / 2;
  const peak = Math.min(y0, y1) - Math.max(90, Math.abs(x1 - x0) * 0.5);
  gsap.set(cup, { x: x0, y: y0, xPercent: -50, yPercent: -50, scale: 0.4, rotation: -20 });
  return gsap.timeline({ onComplete: () => { cup.remove(); onArrive?.(); } })
    .to(cup, {
      duration: 0.62,
      ease: 'power1.inOut',
      motionPath: { path: [{ x: x0, y: y0 }, { x: (x0 + x1) / 2, y: peak }, { x: x1, y: y1 }], curviness: 1.4 },
    })
    .to(cup, { scale: 1, rotation: 25, duration: 0.42, ease: 'power2.out' }, 0)
    .to(cup, { scale: 0.3, rotation: 40, opacity: 0, duration: 0.18, ease: 'power2.in' }, 0.46);
}
