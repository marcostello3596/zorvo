import { gsap } from 'gsap';
import { store, memberCode, randomItem, TOTAL } from '../lib/store.js';
import { createLoyaltyCard } from '../components/loyalty-card.js';
import { createPass } from '../components/pass.js';
import { qrSvg } from '../lib/qr.js';
import { toast, zConfetti, haptic } from '../lib/fx.js';
import { SVG } from '../lib/svg.js';

const fmtDay = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fmtMonth = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

export function initApp({ reduced, navigate }) {
  const root = document.getElementById('view-app');
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];

  let card = null;
  let pass = null;
  let qrTimer = null;
  let screen = 'app';

  // ---------- render
  function mountCard() {
    const s = store.get();
    const host = $('[data-app-card]');
    host.innerHTML = '';
    card = createLoyaltyCard({ stamps: s.stamps, number: s.number, name: s.name });
    host.append(card.el);
  }

  function renderTexts() {
    const s = store.get();
    $('[data-app-name]').textContent = s.name;
    $('[data-app-member]').textContent = `Miembro N° ${s.number}${s.demo ? ' · datos de ejemplo' : ''}`;
    const left = TOTAL - s.stamps;
    $('[data-app-progress]').innerHTML = left <= 0
      ? '<b>Tarjeta completa.</b> Tenés un café de regalo esperándote.'
      : left === 1
        ? '<b>Una más</b> y el próximo va por nuestra cuenta.'
        : s.stamps === 0
          ? `Mostrá tu QR en tu próximo café y sumá tu primera Z.`
          : `Te faltan <b>${left} Z</b> para tu café de regalo.`;
    renderRecent();
    renderHistory();
  }

  function rowHtml(h) {
    const d = new Date(h.t);
    const reward = h.type === 'reward';
    return `<li class="hist__row${reward ? ' hist__row--reward' : ''}">
      <span class="hist__ico">${reward ? SVG.mascot : SVG.cup}</span>
      <span class="hist__main"><b>${reward ? 'Café de regalo canjeado' : h.item}</b><span class="label">${fmtDay.format(d)} · ${fmtTime.format(d)}</span></span>
      <span class="hist__z">${reward ? '−10' : '+1'}<span class="hist__zz">${SVG.zsolid}</span></span>
    </li>`;
  }

  function renderRecent() {
    const s = store.get();
    const list = $('[data-app-recent]');
    const items = s.history.slice(0, 3);
    list.innerHTML = items.length
      ? items.map(rowHtml).join('')
      : '<li class="hist__empty">Todavía no sumaste cafés. El primero está a un QR de distancia.</li>';
  }

  function renderHistory() {
    const s = store.get();
    const zs = s.history.filter((h) => h.type === 'z').length;
    const rewards = s.history.filter((h) => h.type === 'reward').length;
    $('[data-hist-stats]').innerHTML = `
      <div class="stat"><b>${zs}</b><span class="label">Z sumadas</span></div>
      <div class="stat"><b>${rewards}</b><span class="label">Cafés de regalo</span></div>
      <div class="stat"><b>${s.stamps}/${TOTAL}</b><span class="label">Tarjeta actual</span></div>`;
    const groups = new Map();
    s.history.forEach((h) => {
      const k = fmtMonth.format(new Date(h.t));
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(h);
    });
    $('[data-hist-groups]').innerHTML = groups.size
      ? [...groups].map(([k, items]) => `<h2 class="hist__month label">${k}</h2><ul class="hist">${items.map(rowHtml).join('')}</ul>`).join('')
      : '<p class="hist__empty">Acá vas a ver cada café que sumes.</p>';
  }

  // ---------- pantallas
  function show(name, { delay = 0 } = {}) {
    screen = name;
    $$('[data-screen]').forEach((sc) => { sc.hidden = sc.dataset.screen !== name; });
    $$('[data-tab]').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    root.classList.toggle('is-register', name === 'registro');
    window.scrollTo(0, 0);
    if (!reduced) {
      const sc = $(`[data-screen="${name}"]`);
      gsap.from(sc.children, { y: 28, opacity: 0, stagger: 0.05, duration: 0.7, delay, ease: 'expo.out', clearProps: 'all' });
      if (name === 'app' && card) {
        gsap.from(card.el, { rotationX: 40, y: 40, duration: 1.1, delay: delay + 0.05, ease: 'expo.out', transformPerspective: 900, clearProps: 'transform' });
      }
    }
  }

  // ---------- sheets
  function openSheet(name) {
    const sh = $(`[data-sheet="${name}"]`);
    sh.hidden = false;
    document.documentElement.classList.add('is-locked');
    const panel = sh.querySelector('.sheet__panel');
    const bd = sh.querySelector('.sheet__backdrop');
    gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: reduced ? 0 : 0.55, ease: 'expo.out' });
    setupSheetDrag(sh, panel, name);
    panel.querySelector('button')?.focus({ preventScroll: true });
  }

  function closeSheet(name) {
    const sh = $(`[data-sheet="${name}"]`);
    if (!sh || sh.hidden) return Promise.resolve();
    const panel = sh.querySelector('.sheet__panel');
    const bd = sh.querySelector('.sheet__backdrop');
    if (name === 'qr') stopQrTimer();
    return new Promise((res) => {
      gsap.to(bd, { opacity: 0, duration: 0.25 });
      gsap.to(panel, {
        yPercent: 100, duration: reduced ? 0 : 0.35, ease: 'power3.in',
        onComplete: () => { sh.hidden = true; gsap.set(panel, { clearProps: 'all' }); document.documentElement.classList.remove('is-locked'); res(); },
      });
    });
  }

  // arrastrar la hoja hacia abajo para cerrar
  function setupSheetDrag(sh, panel, name) {
    if (panel.dataset.drag) return;
    panel.dataset.drag = '1';
    const grab = panel.querySelector('.sheet__grab');
    let y0 = null;
    grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; grab.setPointerCapture(e.pointerId); });
    grab.addEventListener('pointermove', (e) => { if (y0 === null) return; gsap.set(panel, { y: Math.max(0, e.clientY - y0) }); });
    grab.addEventListener('pointerup', (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0; y0 = null;
      if (dy > 90) closeSheet(name).then(() => gsap.set(panel, { y: 0 }));
      else gsap.to(panel, { y: 0, duration: 0.4, ease: 'back.out(2)' });
    });
  }

  function renderQr() {
    const s = store.get();
    const code = memberCode(s);
    $('[data-qr]').innerHTML = qrSvg(code);
    $('[data-qr-id]').textContent = code;
  }

  function startQrTimer() {
    stopQrTimer();
    const ring = $('.qr-timer__ring');
    const left = $('[data-qr-left]');
    const tick = () => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      left.textContent = sec;
      ring.style.strokeDashoffset = `${100 - (sec / 30) * 100}`;
      if (sec === 30) renderQr();
    };
    tick();
    qrTimer = setInterval(tick, 1000);
  }
  function stopQrTimer() { clearInterval(qrTimer); qrTimer = null; }

  function openQr() {
    renderQr();
    startQrTimer();
    openSheet('qr');
    haptic(6);
  }

  function openWallet() {
    const s = store.get();
    const host = $('[data-wallet-pass]');
    if (!pass) { pass = createPass({}); host.append(pass.el); }
    pass.update({ ...s, code: memberCode(s) });
    openSheet('wallet');
  }

  function addToWallet() {
    const p = $('[data-wallet-pass] .pass');
    gsap.timeline()
      .to(p, { scale: 0.9, y: -10, duration: 0.2, ease: 'power2.out' })
      .to(p, { y: '120%', scale: 0.6, rotation: 4, duration: 0.5, ease: 'power3.in' })
      .add(() => closeSheet('wallet').then(() => gsap.set(p, { clearProps: 'all' })))
      .add(() => toast('Pase agregado (demo). Se actualiza solo con cada Z.'));
    haptic(12);
  }

  // ---------- modo barista (demo): escaneo -> +1 Z
  let scanning = false;
  async function simulateScan() {
    if (scanning) return;
    scanning = true;
    await closeSheet('qr');
    if (screen !== 'app') { navigate('app', { instant: true }); }
    const s0 = store.get();
    if (s0.stamps >= TOTAL) { scanning = false; openReward(); return; }

    const scan = $('[data-scan]');
    const txt = $('[data-scan-txt]');
    scan.hidden = false;
    txt.textContent = 'Leyendo QR…';
    const tl = gsap.timeline();
    tl.fromTo(scan, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .fromTo('.scan__line', { yPercent: -100 }, { yPercent: 900, duration: 0.7, ease: 'sine.inOut', repeat: 1, yoyo: true }, 0)
      .add(() => { txt.textContent = '¡Z sumada!'; haptic(10); })
      .to(scan, { opacity: 0, duration: 0.3, delay: 0.35 })
      .add(() => { scan.hidden = true; });
    await tl;

    // sellar en la tarjeta
    const r = card.el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) card.el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    await gsap.delayedCall(0.25, () => {});
    const n = card.add({ reduced });
    const history = [{ t: Date.now(), item: randomItem(), type: 'z' }, ...store.get().history];
    store.set({ stamps: n, history });
    renderTexts();
    if (n >= TOTAL) {
      gsap.delayedCall(0.8, openReward);
    } else {
      const left = TOTAL - n;
      toast(left === 1 ? 'Sumaste una Z. ¡La próxima es de regalo!' : `Sumaste una Z. Te faltan ${left}.`);
    }
    scanning = false;
  }

  // ---------- premio
  function openReward() {
    const s = store.get();
    const el = $('[data-reward]');
    $('[data-reward-qr]').innerHTML = qrSvg(`ZRV-REGALO-${s.number}-${s.cards + 1}`);
    el.hidden = false;
    document.documentElement.classList.add('is-locked');
    if (!reduced) {
      gsap.fromTo(el, { clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)', duration: 0.9, ease: 'expo.inOut' });
      gsap.from(el.querySelectorAll('.reward__inner > *'), { y: 30, opacity: 0, stagger: 0.06, delay: 0.35, duration: 0.7, ease: 'expo.out' });
      gsap.to('.reward__mascot .m-cup', { y: -14, duration: 0.4, ease: 'power1.inOut', yoyo: true, repeat: -1 });
      gsap.delayedCall(0.5, () => zConfetti(window.innerWidth / 2, window.innerHeight * 0.32, { count: 36 }));
    }
    haptic([20, 50, 30]);
  }
  function closeReward() {
    const el = $('[data-reward]');
    gsap.killTweensOf('.reward__mascot .m-cup');
    return new Promise((res) => {
      gsap.to(el, {
        clipPath: 'circle(0% at 50% 100%)', duration: reduced ? 0 : 0.6, ease: 'expo.inOut',
        onComplete: () => { el.hidden = true; gsap.set(el, { clearProps: 'clipPath' }); document.documentElement.classList.remove('is-locked'); res(); },
      });
    });
  }
  async function redeem() {
    const s = store.get();
    store.set({ stamps: 0, cards: s.cards + 1, history: [{ t: Date.now(), item: 'Café de regalo', type: 'reward' }, ...s.history] });
    await closeReward();
    // tarjeta nueva: la vieja se va, entra la limpia
    const old = card.el;
    if (!reduced) await gsap.to(old, { x: '-120%', rotation: -12, duration: 0.5, ease: 'power3.in' });
    mountCard();
    renderTexts();
    if (!reduced) gsap.from(card.el, { x: '120%', rotation: 12, duration: 0.8, ease: 'expo.out' });
    toast('¡Que lo disfrutes! Arrancaste una tarjeta nueva.');
  }

  // ---------- registro
  const form = $('[data-reg-form]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameIn = form.querySelector('#reg-name');
    const contactIn = form.querySelector('#reg-contact');
    const name = nameIn.value.trim();
    const contact = contactIn.value.trim();
    const err = $('[data-reg-err]');
    const okContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || /^\+?[\d\s-]{8,}$/.test(contact);
    if (!name) { nameIn.focus(); err.hidden = false; err.textContent = 'Poné tu nombre así sabemos cómo llamarte.'; return; }
    if (!okContact) { contactIn.focus(); err.hidden = false; err.textContent = 'Revisá el email o celular: con eso recuperás tu tarjeta.'; return; }
    err.hidden = true;
    const number = String(Math.floor(1000 + Math.random() * 8999));
    store.set({ demo: false, name: name.slice(0, 24), contact, number, stamps: 0, cards: 0, history: [] });
    mountCard();
    renderTexts();
    form.reset();
    navigate('app', { instant: true });
    toast(`¡Bienvenido/a al club, ${name.split(' ')[0]}! Tu tarjeta está lista.`);
  });

  // ---------- eventos
  root.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-open-qr]')) openQr();
    else if (t.closest('[data-open-wallet]')) openWallet();
    else if (t.closest('[data-wallet-add]')) addToWallet();
    else if (t.closest('[data-simulate]')) simulateScan();
    else if (t.closest('[data-redeem]')) redeem();
    else if (t.closest('[data-reward-close]')) closeReward();
    else if (t.closest('[data-reset]')) {
      store.reset(); mountCard(); renderTexts(); toast('Demo reiniciada con datos de ejemplo.');
    } else {
      const c = t.closest('[data-close]');
      if (c) closeSheet(c.closest('[data-sheet]').dataset.sheet);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || root.hidden) return;
    $$('[data-sheet]').forEach((sh) => { if (!sh.hidden) closeSheet(sh.dataset.sheet); });
  });

  mountCard();
  renderTexts();

  return {
    show,
    openWallet,
    get screen() { return screen; },
  };
}
