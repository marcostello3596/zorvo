import { gsap } from 'gsap';
import { SVG, zSlot } from '../lib/svg.js';
import { haptic } from '../lib/fx.js';

/**
 * Tarjeta de fidelidad ZORVO: 10 Z que se sellan.
 * Estructura: .loyalty (perspectiva) > .loyalty__tilt (inclinación) > .loyalty__inner (giro) > caras
 */
export function createLoyaltyCard({ stamps = 0, total = 10, number = '0482', name = '', tilt = true, idle = false } = {}) {
  const el = document.createElement('div');
  el.className = 'loyalty';
  el.innerHTML = `
    <div class="loyalty__tilt">
      <div class="loyalty__inner">
        <div class="loyalty__face loyalty__front">
          <div class="loyalty__top">
            <span class="loyalty__logo">${SVG.logo}</span>
            <span class="loyalty__no">N° ${number}</span>
          </div>
          <p class="loyalty__msg">El buen café merece volver a encontrarse.</p>
          <div class="loyalty__grid">${Array.from({ length: total }, (_, i) => `<span class="zslot" data-i="${i}">${zSlot()}</span>`).join('')}</div>
          <div class="loyalty__foot">
            <span>${name ? `${escapeHtml(name)} · ` : ''}Con cada café sumás una Z.</span>
            <b class="loyalty__count"><span data-count>${stamps}</span>/${total}</b>
          </div>
          <span class="loyalty__shine" aria-hidden="true"></span>
        </div>
        <div class="loyalty__face loyalty__back">
          <span class="loyalty__back-mascot">${SVG.mascot}</span>
          <div>
            <p class="loyalty__back-k">Tarjeta completa</p>
            <p class="loyalty__back-title">Café de<br>regalo</p>
            <p class="loyalty__back-s">Va por nuestra cuenta.</p>
          </div>
        </div>
      </div>
    </div>`;

  const slots = [...el.querySelectorAll('.zslot')];
  const fills = slots.map((s) => s.querySelector('.zslot__ink'));
  const countEl = el.querySelector('[data-count]');
  const inner = el.querySelector('.loyalty__inner');
  const tiltEl = el.querySelector('.loyalty__tilt');
  const shine = el.querySelector('.loyalty__shine');
  let count = 0;
  let flipped = false;

  // rotación "a mano" fija por slot para que cada sello caiga distinto
  const rots = slots.map(() => gsap.utils.random(-12, 9, 1));

  function setStamps(n) {
    count = Math.max(0, Math.min(total, n));
    fills.forEach((f, i) => {
      gsap.killTweensOf(f);
      gsap.set(f, { opacity: i < count ? 1 : 0, scale: 1, rotation: rots[i], transformOrigin: '50% 50%' });
    });
    slots.forEach((s, i) => s.classList.toggle('is-on', i < count));
    countEl.textContent = count;
  }

  function splat(slot) {
    const r = slot.getBoundingClientRect();
    const host = el.getBoundingClientRect();
    const cx = r.left - host.left + r.width / 2;
    const cy = r.top - host.top + r.height / 2;
    for (let i = 0; i < 7; i++) {
      const dot = document.createElement('i');
      dot.className = 'splat';
      const s = gsap.utils.random(3, 7);
      Object.assign(dot.style, { width: `${s}px`, height: `${s}px`, left: `${cx}px`, top: `${cy}px` });
      tiltEl.appendChild(dot);
      const a = gsap.utils.random(0, Math.PI * 2);
      const dist = gsap.utils.random(r.width * 0.45, r.width * 0.9);
      gsap.fromTo(dot, { x: -s / 2, y: -s / 2, scale: 1 }, {
        x: Math.cos(a) * dist - s / 2,
        y: Math.sin(a) * dist - s / 2,
        scale: 0,
        duration: gsap.utils.random(0.35, 0.6),
        ease: 'expo.out',
        onComplete: () => dot.remove(),
      });
    }
  }

  /** Sella la próxima Z. Devuelve el nuevo total. */
  function add({ reduced = false } = {}) {
    if (count >= total) return count;
    const i = count;
    count += 1;
    const f = fills[i];
    const slot = slots[i];
    slot.classList.add('is-on');
    if (reduced) {
      gsap.set(f, { opacity: 1, scale: 1, rotation: rots[i] });
    } else {
      gsap.timeline()
        .set(f, { opacity: 1, scale: 2.4, rotation: rots[i] - 20, transformOrigin: '50% 50%' })
        .to(f, { scale: 1, rotation: rots[i], duration: 0.26, ease: 'power4.in' })
        .add(() => { splat(slot); haptic(14); })
        .fromTo(slot, { scale: 1.18 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' }, '<')
        .fromTo(inner, { y: 0 }, { y: 3, duration: 0.05, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '<');
    }
    rollCount(count);
    return count;
  }

  function rollCount(n) {
    gsap.timeline()
      .to(countEl, { yPercent: -60, opacity: 0, duration: 0.14, ease: 'power2.in' })
      .add(() => { countEl.textContent = n; })
      .fromTo(countEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'back.out(3)' });
  }

  function flip(toBack = !flipped, { duration = 1.1 } = {}) {
    flipped = toBack;
    return gsap.to(inner, { rotationY: toBack ? 180 : 0, duration, ease: 'expo.inOut' });
  }

  // Inclinación: con mouse sigue al puntero. Con el dedo NO (al scrollear quedaba
  // trabada torcida); en su lugar, un "apretón" al tocar y un vaivén suave opcional.
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tilt && !touch) {
    const qx = gsap.quickTo(tiltEl, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const qy = gsap.quickTo(tiltEl, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      qx(px * 16);
      qy(-py * 14);
      shine.style.setProperty('--sx', `${(px + 0.5) * 100}%`);
      shine.style.setProperty('--sy', `${(py + 0.5) * 100}%`);
    });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  }
  if (touch && !reducedMotion) {
    el.addEventListener('pointerdown', () => gsap.to(tiltEl, { scale: 0.975, duration: 0.18, ease: 'power2.out', overwrite: 'auto' }));
    const release = () => gsap.to(tiltEl, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    if (idle) {
      gsap.fromTo(tiltEl, { rotationY: -7, rotationX: 4 }, { rotationY: 7, rotationX: -3, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }
  }

  setStamps(stamps);

  return {
    el,
    add,
    flip,
    setStamps,
    get count() { return count; },
    get flipped() { return flipped; },
    slot: (i) => slots[Math.min(i, total - 1)],
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
