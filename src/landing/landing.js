import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { SVG, badge, zSlot } from '../lib/svg.js';
import { createLoyaltyCard } from '../components/loyalty-card.js';
import { createPass } from '../components/pass.js';
import { flyCup, zConfetti, haptic } from '../lib/fx.js';

export function initLanding({ reduced }) {
  const root = document.getElementById('view-landing');
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  let gl = null;
  const loops = [];

  // ---------- contenido generado
  $$('[data-badge]').forEach((el) => { el.innerHTML = badge({ dark: el.dataset.badge === 'footer' }); });
  buildBands();
  const stepGrid = $('[data-zgrid]');
  stepGrid.innerHTML = Array.from({ length: Number(stepGrid.dataset.zgrid) }, () => `<span class="zslot">${zSlot()}</span>`).join('');

  const phonePass = createPass({ name: 'Juli', number: '0482', stamps: 7, code: 'ZRV-0482-7319', compact: true });
  $('[data-phone-pass]').append(phonePass.el);

  const demo = setupDemo();
  setupStickers();
  watchTopbarLogo();
  setupFooterLogo();

  function buildBands() {
    const items = ['Cool brew coffee', 'Cultura del buen café', 'Calidad al paso', 'Grab & go'];
    const z = `<span class="band__z">${SVG.zsolid}</span>`;
    $$('[data-band]').forEach((track, k) => {
      const list = k ? items : [...items].reverse();
      const seq = [...list, ...list].map((t) => `<span>${t}</span>${z}`).join('');
      track.innerHTML = `<span class="band__seq">${seq}</span><span class="band__seq">${seq}</span>`;
    });
  }

  // ---------- tarjeta interactiva
  function setupDemo() {
    const host = $('[data-demo-card]');
    const card = createLoyaltyCard({ stamps: 3, number: '0001' });
    host.append(card.el);
    const btn = $('[data-demo-btn]');
    const label = $('[data-demo-btn-label]');
    const count = $('[data-demo-count]');
    const note = $('.demo__note');
    let pending = 0;
    let resetting = false;

    btn.addEventListener('click', () => {
      if (resetting) return;
      if (card.count >= 10 && pending === 0) {
        resetting = true;
        card.flip(false, { duration: 0.9 }).then(() => {
          card.setStamps(0);
          count.textContent = '0';
          label.textContent = 'Pedir un café';
          resetting = false;
        });
        return;
      }
      if (card.count + pending >= 10) return;
      haptic(8);
      if (note) gsap.to(note, { opacity: 0, y: -10, duration: 0.3, onComplete: () => note.remove() });
      const target = card.slot(card.count + pending);
      pending += 1;
      const arrive = () => {
        pending -= 1;
        const n = card.add({ reduced });
        count.textContent = n;
        if (n === 10) celebrate();
      };
      if (reduced) arrive();
      else flyCup(btn, target, { onArrive: arrive });
    });

    function celebrate() {
      const r = card.el.getBoundingClientRect();
      zConfetti(r.left + r.width / 2, r.top + r.height * 0.4);
      haptic([20, 40, 30]);
      gsap.delayedCall(0.55, () => card.flip(true));
      label.textContent = 'Empezar de nuevo';
    }
    return card;
  }

  // ---------- stickers Z: giran con el scroll y dan una vuelta al tocarlos
  function setupStickers() {
    $$('.zst__in').forEach((inner) => {
      inner.addEventListener('click', () => {
        haptic(8);
        gsap.timeline({ overwrite: 'auto' })
          .to(inner, { scale: 1.22, duration: 0.14, ease: 'power2.out' })
          .to(inner, { rotation: '+=360', duration: 0.85, ease: 'back.out(1.5)' }, 0)
          .to(inner, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }, 0.14);
      });
    });
  }

  // ---------- topbar: el logo chico aparece solo cuando el grande ya salió de pantalla
  function watchTopbarLogo() {
    const topbar = document.getElementById('topbar');
    const io = new IntersectionObserver(([en]) => {
      if (root.hidden) return;
      topbar.classList.toggle('show-logo', !en.isIntersecting && en.boundingClientRect.top < 0);
    }, { rootMargin: '-72px 0px 0px 0px' });
    io.observe($('.hero__logo'));
  }

  // ---------- footer: las letras saltan
  function setupFooterLogo() {
    const logo = $('[data-footer-logo]');
    const letters = [...logo.querySelectorAll('path')];
    const hop = (el, i = 0) => {
      if (gsap.isTweening(el)) return;
      gsap.timeline({ delay: i * 0.05 })
        .to(el, { y: -38, rotation: gsap.utils.random(-10, 10), duration: 0.22, ease: 'power2.out', transformOrigin: '50% 100%' })
        .to(el, { y: 0, rotation: 0, duration: 0.7, ease: 'bounce.out' });
    };
    letters.forEach((l) => l.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hop(l); }));
    logo.addEventListener('click', () => { letters.forEach((l, i) => hop(l, i)); haptic(10); });
    logo.dataset.cursor = 'Tocá';
  }

  // ---------- animaciones de scroll
  const ctx = gsap.context(() => {
    if (reduced) return;

    // el caminante cruza la escena
    const stage = $('[data-hero-stage]');
    const walker = $('[data-walker]');
    ScrollTrigger.create({
      trigger: stage,
      start: 'clamp(top bottom)',
      end: 'clamp(bottom top)',
      scrub: 0.6,
      onUpdate(self) {
        const p = self.progress;
        const travel = stage.clientWidth - walker.clientWidth * 0.8;
        const step = Math.sin(p * Math.PI * 9);
        gsap.set(walker, { x: p * travel, y: -Math.abs(step) * 9, rotation: step * 2.2 });
      },
    });

    // marquesinas: velocidad y dirección según el scroll
    $$('[data-band]').forEach((track) => {
      const dir = Number(track.dataset.band);
      loops.push(gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 26, ease: 'none', repeat: -1 }));
    });
    let boost = 1;
    let sign = 1;
    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        sign = self.direction;
        boost = Math.min(7, 1 + Math.abs(self.getVelocity()) / 350);
      },
    });
    gsap.ticker.add(() => {
      boost += (1 - boost) * 0.06;
      loops.forEach((l) => { l.timeScale(l.timeScale() + (sign * boost - l.timeScale()) * 0.15); });
    });

    gsap.to('.marquee .band--y', { rotation: -2, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.marquee .band--k', { rotation: 5, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });

    // manifiesto: las palabras se encienden
    SplitText.create('[data-split]', {
      type: 'words',
      wordsClass: 'w',
      autoSplit: true,
      onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.18 }, {
        opacity: 1, stagger: 0.12, ease: 'none',
        scrollTrigger: { trigger: '[data-split]', start: 'top 82%', end: 'bottom 50%', scrub: true },
      }),
    });
    gsap.fromTo('[data-leaner]', { rotation: -7, y: 30 }, {
      rotation: 3, y: -24, ease: 'none',
      scrollTrigger: { trigger: '.manifesto__row', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.quote__ul path', { drawSVG: '0%' }, {
      drawSVG: '100%', ease: 'none',
      scrollTrigger: { trigger: '.quote', start: 'top 78%', end: 'top 40%', scrub: true },
    });

    // pasos: tarjetas que se apilan
    const cards = $$('.step');
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.to(card, {
        scale: 0.9, '--dim': 0.45, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 25%', scrub: true },
      });
    });
    gsap.fromTo('.step__art--qr .scan', { y: -22 }, { y: 22, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.step__art--phone', { y: -8, rotation: 3, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    const zFills = $$('.step__zgrid .z-fill');
    const zl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, scrollTrigger: { trigger: '.step--yellow', start: 'top bottom', toggleActions: 'play pause resume pause' } });
    zFills.forEach((f, i) => {
      zl.fromTo(f, { opacity: 1, scale: 2, rotation: -24, transformOrigin: '50% 50%' }, { scale: 1, rotation: gsap.utils.random(-10, 8), duration: 0.24, ease: 'power4.in' }, i * 0.32)
        .fromTo(f.closest('.zslot'), { scale: 1.2 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,.45)' }, '>');
    });
    zl.to(zFills, { opacity: 0, duration: 0.25, stagger: 0.03 }, '+=1.1');

    // demo: entra la tarjeta
    gsap.from('[data-demo-card]', {
      rotation: -6, y: 50, ease: 'none',
      scrollTrigger: { trigger: '.demo__stage', start: 'top bottom', end: 'top 45%', scrub: true },
    });

    // stickers Z: flotan y dan vueltas mientras scrolleás
    $$('.zst').forEach((st, i) => {
      const dir = i % 2 ? 1 : -1;
      const speed = parseFloat(st.dataset.speed) || 0.5;
      // giro acotado para que siempre se lea como Z (a 90° parece una N)
      gsap.fromTo(st, { y: 70 * speed, rotation: -dir * 18 }, {
        y: -150 * speed, rotation: dir * 28, ease: 'none',
        scrollTrigger: { trigger: st, start: 'top bottom', end: 'bottom top', scrub: 0.9 },
      });
    });

    // wallet: el pase entra en el teléfono
    gsap.fromTo('[data-phone-pass]', { yPercent: 62, rotation: -5 }, {
      yPercent: 0, rotation: 0, ease: 'none',
      scrollTrigger: { trigger: '[data-phone]', start: 'top 90%', end: 'center 55%', scrub: true },
    });
    gsap.from('[data-phone-notif]', {
      y: -24, scale: 0.85, duration: 0.6, ease: 'back.out(2.2)',
      scrollTrigger: { trigger: '[data-phone]', start: 'center 62%', toggleActions: 'play none none reverse' },
    });
    gsap.fromTo('[data-phone]', { rotation: 4 }, {
      rotation: -3, ease: 'none',
      scrollTrigger: { trigger: '.wallet', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // footer
    gsap.from('.footer__logo path', {
      yPercent: 70, rotation: () => gsap.utils.random(-12, 12), stagger: 0.06, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 40%', scrub: true },
    });
  }, root);

  // ---------- WebGL del hero
  let glPromise = null;
  function startGL() {
    if (!glPromise) glPromise = createGL();
    return glPromise;
  }
  async function createGL() {
    if (reduced) return null;
    const svg = $('.hero__svg svg');
    try {
      // three.js se carga aparte para no frenar el primer render
      const { initHeroGL } = await import('./hero-gl.js');
      gl = await initHeroGL($('#hero-gl'), svg);
    } catch { gl = null; }
    if (!gl) return null;
    ctx.add(() => {
      ScrollTrigger.create({
        trigger: '.hero__logo',
        start: 'clamp(top top+=110)',
        end: 'clamp(bottom top)',
        onUpdate(self) {
          const p = self.progress;
          gl.setDrip(p * 0.22);
        },
      });
    });
    // un toque (no el arranque de un scroll) al hero también genera una onda
    $('.hero').addEventListener('click', (e) => {
      if (e.target.closest('canvas, a, button, .zst')) return;
      gl.ripple(Math.random() * 0.6 + 0.2, 0.62);
    });
    return gl;
  }

  return {
    demo,
    startGL,
    intro() {
      const tl = gsap.timeline();
      if (reduced) return tl;
      if (gl) tl.add(gl.intro(1.7), 0);
      else tl.from('.hero__svg path', { yPercent: 120, stagger: 0.07, duration: 1.1, ease: 'expo.out' }, 0);
      tl.from('.hero__meta .label', { y: -14, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, 0.1)
        .from('.hero__slogan', { clipPath: 'inset(0 100% 0 0)', duration: 1, ease: 'expo.out' }, 0.55)
        .from('.hero__est', { scale: 0, rotation: -50, duration: 0.9, ease: 'back.out(2.5)' }, 0.85)
        .from('.hero__lede', { y: 26, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0.7)
        .from('.hero__ctas > *, .hero__fine', { y: 20, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out' }, 0.85)
        .from('[data-walker]', { xPercent: -130, duration: 1.5, ease: 'power3.out' }, 0.5)
        .from('.hero__badge, .hero__sp1, .hero__sp2', { scale: 0, rotation: -90, stagger: 0.1, duration: 0.9, ease: 'back.out(2)' }, 1)
        .from('.zst--hero .zst__in', { scale: 0, duration: 0.8, ease: 'back.out(2.4)' }, 1.15);
      return tl;
    },
    enable() {
      ScrollTrigger.getAll().forEach((st) => st.enable(false));
      loops.forEach((l) => l.resume());
      ScrollTrigger.refresh();
    },
    disable() {
      ScrollTrigger.getAll().forEach((st) => st.disable(false));
      loops.forEach((l) => l.pause());
    },
  };
}
