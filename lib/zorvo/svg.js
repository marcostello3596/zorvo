// Assets vectoriales de la marca (extraídos del manual de ZORVO) + doodles propios.
// Este módulo es puro (sin DOM): se puede usar en el servidor y en el cliente.
import * as raw from './svgs.js';

// Geometría de la Z del logotipo (se usa para sellos, íconos y stickers)
export const Z = {
  vb: raw.zglyph.match(/viewBox="([^"]+)"/)[1],
  t: raw.zglyph.match(/transform="([^"]+)"/)[1],
  d: raw.zglyph.match(/ d="([^"]+)"/)[1],
};

const zsolid = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Z.vb}"><path transform="${Z.t}" d="${Z.d}" fill="currentColor"/></svg>`;
const zsticker = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 193 169"><path transform="${Z.t}" d="${Z.d}" fill="currentColor" stroke="#fff" stroke-width="22" stroke-linejoin="round" paint-order="stroke"/></svg>`;
const cardico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M6 10h3.2L6 14h3.2M11 10h3.2L11 14h3.2"/><path d="M16.5 10h2"/></svg>`;
const listico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>`;
const routeico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/></svg>`;
const scanico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M4 12h16"/></svg>`;
const usersico = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 20a6.5 6.5 0 0 0-3-5.5"/></svg>`;

export const SVG = { ...raw, zsolid, zsticker, cardico, listico, routeico, scanico, usersico };

/**
 * Una Z para la tarjeta en dos capas: contorno (vacía) + tinta (sellada).
 * La tinta es su propio <svg> para animarla con transform CSS: el filtro de
 * textura se dibuja una sola vez y el celular solo mueve una imagen (fluido).
 */
export function zSlot(extra = '') {
  return `<svg class="zslot__svg zslot__out ${extra}" viewBox="${Z.vb}" aria-hidden="true" focusable="false"><g transform="${Z.t}"><path class="z-out" d="${Z.d}"/></g></svg>`
    + `<svg class="zslot__svg zslot__ink" viewBox="${Z.vb}" aria-hidden="true" focusable="false"><g transform="${Z.t}"><path class="z-fill" d="${Z.d}"/></g></svg>`;
}

/** Badge circular "Los momentos más breves merecen estar bien hechos". */
export function badge({ dark = false, id = 'bp' } = {}) {
  const txt = 'LOS MOMENTOS MÁS BREVES ✶ MERECEN ESTAR BIEN HECHOS ✶ ';
  return `<svg class="badge ${dark ? 'badge--dark' : ''}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <defs><path id="${id}" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs>
    <circle class="badge__bg" cx="100" cy="100" r="98"/>
    <g class="badge__spin"><text class="badge__txt"><textPath href="#${id}" textLength="474" lengthAdjust="spacing">${txt}</textPath></text></g>
    <circle class="badge__dot" cx="100" cy="100" r="40"/>
    <g transform="translate(100 100) scale(.36) translate(-82.5 -70.45)"><path class="badge__z" transform="${Z.t}" d="${Z.d}"/></g>
  </svg>`;
}
