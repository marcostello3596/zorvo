import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/landing.css';
import './styles/app.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import Lenis from 'lenis';

import { hydrateSvgs, zSlot } from './lib/svg.js';
import { initLanding } from './landing/landing.js';
import { initApp } from './app/app.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, Physics2DPlugin);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
document.documentElement.classList.add('js');
if (reduced) document.documentElement.classList.add('reduced');

hydrateSvgs(document);

// ---------- scroll suave (solo desktop; en touch se usa el nativo)
let lenis = null;
if (!reduced && finePointer) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTop = () => (lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0));

// ---------- vistas
const views = {
  landing: document.getElementById('view-landing'),
  app: document.getElementById('view-app'),
};
const APP_SCREENS = ['app', 'historial', 'registro'];
const topbar = document.getElementById('topbar');
const topCta = topbar.querySelector('[data-topbar-cta]');
const topLabel = topbar.querySelector('[data-topbar-label]');

const landing = initLanding({ reduced });
const app = initApp({ reduced, navigate });
let current = null;

function routeFromHash() {
  const h = location.hash.replace('#', '');
  return APP_SCREENS.includes(h) ? h : 'home';
}

function applyRoute(route) {
  const toApp = route !== 'home';
  views.landing.hidden = toApp;
  views.app.hidden = !toApp;
  document.body.dataset.view = toApp ? 'app' : 'landing';
  topCta.dataset.route = toApp ? 'home' : 'app';
  topCta.setAttribute('href', toApp ? '#' : '#app');
  topLabel.textContent = toApp ? 'Inicio' : 'Mi tarjeta';
  topbar.classList.toggle('show-logo', toApp);
  if (toApp) {
    landing.disable();
    app.show(route);
  } else {
    landing.enable();
    landing.startGL();
  }
  current = route;
  scrollTop();
}

const curtain = document.getElementById('curtain');
const panel = curtain.querySelector('.curtain__panel');
let transitioning = false;

function navigate(route, { instant = false, push = true } = {}) {
  if (transitioning || route === current) return;
  if (push) {
    try { history.pushState(null, '', route === 'home' ? location.pathname + location.search : `#${route}`); } catch { /* entorno sin history */ }
  }
  const sameView = (route === 'home') === (current === 'home');
  if (instant || reduced || sameView || current === null) { applyRoute(route); return; }
  transitioning = true;
  curtain.style.visibility = 'visible';
  gsap.timeline({ onComplete: () => { transitioning = false; curtain.style.visibility = 'hidden'; } })
    .fromTo(panel, { yPercent: 100, borderRadius: '50% 50% 0 0 / 14vh 14vh 0 0' }, { yPercent: 0, borderRadius: '0% 0% 0 0 / 0vh 0vh 0 0', duration: 0.6, ease: 'expo.in' })
    .fromTo('.curtain__mascot', { scale: 0.4, rotation: -30, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, '-=0.15')
    .add(() => applyRoute(route))
    .to(panel, { yPercent: -100, borderRadius: '0 0 50% 50% / 0 0 14vh 14vh', duration: 0.7, ease: 'expo.inOut' }, '+=0.12')
    .to('.curtain__mascot', { yPercent: -60, opacity: 0, duration: 0.4, ease: 'power2.in' }, '<');
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-route]');
  if (!a) return;
  e.preventDefault();
  navigate(a.dataset.route);
});
window.addEventListener('popstate', () => navigate(routeFromHash(), { push: false }));

// ---------- preloader: la tarjeta se llena de Z
const loader = document.getElementById('loader');
const grid = loader.querySelector('[data-loader-grid]');
grid.innerHTML = Array.from({ length: 10 }, () => `<span class="zslot">${zSlot()}</span>`).join('');

async function boot() {
  const route = routeFromHash();
  applyRoute(route);
  const glReady = route === 'home' ? landing.startGL() : Promise.resolve(null);

  if (reduced) {
    loader.remove();
    await glReady;
    return;
  }
  const count = loader.querySelector('[data-loader-count]');
  const fills = [...grid.querySelectorAll('.z-fill')];
  const n = { v: 0 };
  const tl = gsap.timeline();
  tl.to(n, { v: 10, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(2, '0'); } }, 0);
  fills.forEach((f, i) => {
    tl.fromTo(f, { opacity: 0, scale: 1.7, rotation: gsap.utils.random(-24, 6), transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, rotation: gsap.utils.random(-10, 8), duration: 0.16, ease: 'power3.in', immediateRender: true }, 0.05 + i * 0.1)
      .fromTo(f.closest('.zslot'), { scale: 1.15 }, { scale: 1, duration: 0.35, ease: 'elastic.out(1, .5)' }, '>');
  });
  await Promise.all([tl, glReady.catch(() => null), document.fonts?.ready?.catch(() => null)]);
  await gsap.timeline()
    .to(loader.querySelector('.loader__inner'), { y: -40, opacity: 0, duration: 0.4, ease: 'power2.in' })
    .to(loader, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '-=0.1')
    .add(() => { if (current === 'home') landing.intro(); }, '-=0.55');
  loader.remove();
  ScrollTrigger.refresh();
}
boot();

// ---------- cursor (solo mouse)
if (finePointer && !reduced) {
  const cur = document.querySelector('.cursor');
  const lab = cur.querySelector('.cursor__label');
  document.documentElement.classList.add('has-cursor');
  const qx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3.out' });
  const qy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    qx(e.clientX); qy(e.clientY);
    const t = e.target.closest?.('[data-cursor]');
    const txt = t ? t.dataset.cursor : '';
    if (lab.textContent !== txt) lab.textContent = txt;
    cur.classList.toggle('is-label', !!txt);
    cur.classList.toggle('is-link', !txt && !!e.target.closest?.('a, button, input, label'));
  });
  document.addEventListener('pointerleave', () => cur.classList.add('is-out'));
  document.addEventListener('pointerenter', () => cur.classList.remove('is-out'));
}

// topbar con fondo al scrollear
let lastY = -1;
gsap.ticker.add(() => {
  const y = window.scrollY;
  if ((y > 12) !== (lastY > 12)) topbar.classList.toggle('is-scrolled', y > 12);
  lastY = y;
});
