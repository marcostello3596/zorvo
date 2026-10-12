// Assets vectoriales de la marca (extraídos del manual de ZORVO) + doodles propios.
import logo from '../assets/svg/logo.svg?raw';
import walker from '../assets/svg/walker.svg?raw';
import leaner from '../assets/svg/leaner.svg?raw';
import cup from '../assets/svg/cup.svg?raw';
import mascot from '../assets/svg/mascot.svg?raw';
import slogan from '../assets/svg/slogan.svg?raw';
import est from '../assets/svg/est.svg?raw';
import zglyph from '../assets/svg/zglyph.svg?raw';

import sparkle from '../assets/doodles/sparkle.svg?raw';
import arrow from '../assets/doodles/arrow.svg?raw';
import steam from '../assets/doodles/steam.svg?raw';
import ice from '../assets/doodles/ice.svg?raw';
import glass from '../assets/doodles/glass.svg?raw';
import qr from '../assets/doodles/qr.svg?raw';
import bean from '../assets/doodles/bean.svg?raw';
import scribble from '../assets/doodles/scribble.svg?raw';
import underline from '../assets/doodles/underline.svg?raw';
import strike from '../assets/doodles/strike.svg?raw';
import wallet from '../assets/doodles/wallet.svg?raw';
import phone from '../assets/doodles/phone.svg?raw';
import burst from '../assets/doodles/burst.svg?raw';

// Geometría de la Z del logotipo (se usa para sellos, íconos y stickers)
export const Z = {
  vb: zglyph.match(/viewBox="([^"]+)"/)[1],
  t: zglyph.match(/transform="([^"]+)"/)[1],
  d: zglyph.match(/ d="([^"]+)"/)[1],
};

const zsolid = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Z.vb}"><path transform="${Z.t}" d="${Z.d}" fill="currentColor"/></svg>`;
const zsticker = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 193 169"><path transform="${Z.t}" d="${Z.d}" fill="currentColor" stroke="#fff" stroke-width="22" stroke-linejoin="round" paint-order="stroke"/></svg>`;
const cardico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M6 10h3.2L6 14h3.2M11 10h3.2L11 14h3.2"/><path d="M16.5 10h2"/></svg>`;
const listico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>`;

export const SVG = {
  logo, walker, leaner, cup, mascot, slogan, est, zglyph, zsolid, zsticker,
  sparkle, arrow, steam, ice, glass, qr, bean, scribble, underline, strike, wallet, phone, burst,
  cardico, listico,
};

export function hydrateSvgs(root = document) {
  root.querySelectorAll('[data-svg]').forEach((el) => {
    const src = SVG[el.dataset.svg];
    if (!src || el.dataset.hydrated) return;
    el.innerHTML = src;
    el.dataset.hydrated = '1';
    const svg = el.querySelector('svg');
    if (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }
  });
}

/** Una Z para la tarjeta: contorno (vacía) + relleno (sellada). */
export function zSlot(extra = '') {
  return `<svg class="zslot__svg ${extra}" viewBox="${Z.vb}" aria-hidden="true" focusable="false"><g transform="${Z.t}"><path class="z-out" d="${Z.d}"/><path class="z-fill" d="${Z.d}"/></g></svg>`;
}

let badgeId = 0;
/** Badge circular "Los momentos más breves merecen estar bien hechos". */
export function badge({ dark = false } = {}) {
  const id = `bp${++badgeId}`;
  const txt = 'LOS MOMENTOS MÁS BREVES ✶ MERECEN ESTAR BIEN HECHOS ✶ ';
  return `<svg class="badge ${dark ? 'badge--dark' : ''}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <defs><path id="${id}" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs>
    <circle class="badge__bg" cx="100" cy="100" r="98"/>
    <g class="badge__spin"><text class="badge__txt"><textPath href="#${id}" textLength="474" lengthAdjust="spacing">${txt}</textPath></text></g>
    <circle class="badge__dot" cx="100" cy="100" r="40"/>
    <g transform="translate(100 100) scale(.36) translate(-82.5 -70.45)"><path class="badge__z" transform="${Z.t}" d="${Z.d}"/></g>
  </svg>`;
}
