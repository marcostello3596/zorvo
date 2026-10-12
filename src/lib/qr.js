import qrcode from 'qrcode-generator';
import { Z } from './svg.js';

/**
 * QR en SVG con ojos redondeados y la Z al centro.
 * Corrección de errores H (30%) para que el logo no afecte la lectura.
 */
export function qrSvg(text, { logo = true, fg = '#161513', bg = '#ffffff', accent = '#76262F' } = {}) {
  const qr = qrcode(0, 'H');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const q = 2; // quiet zone
  const size = n + q * 2;
  const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hole = logo ? Math.ceil(n * 0.22) | 1 : 0;
  const h0 = Math.floor((n - hole) / 2);
  const inHole = (r, c) => logo && r >= h0 && r < h0 + hole && c >= h0 && c < h0 + hole;

  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c) || inFinder(r, c) || inHole(r, c)) continue;
      d += `M${c + q} ${r + q}h1v1h-1z`;
    }
  }
  const eye = (x, y) => `
    <rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.8" fill="none" stroke="${fg}" stroke-width="1"/>
    <rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9" fill="${accent}"/>`;
  const zScale = (hole - 1.2) / 165;
  const center = q + h0 + hole / 2;
  const zMark = logo
    ? `<g transform="translate(${center} ${center}) scale(${zScale}) translate(-82.5 -70.45)"><path transform="${Z.t}" d="${Z.d}" fill="${accent}"/></g>`
    : '';
  return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="Código QR">
    <rect width="${size}" height="${size}" fill="${bg}"/>
    <path d="${d}" fill="${fg}"/>
    <g shape-rendering="geometricPrecision">${eye(q, q)}${eye(q + n - 7, q)}${eye(q, q + n - 7)}${zMark}</g>
  </svg>`;
}
