import { SVG, zSlot } from '../lib/svg.js';
import { qrSvg } from '../lib/qr.js';

/**
 * Pase de Apple Wallet (tipo storeCard) tal como se va a ver en el iPhone.
 * Campos pensados para PassKit: logo, headerField (sellos), strip (las 10 Z),
 * secondaryFields (miembro / próximo premio) y barcode QR.
 */
export function createPass({ name = 'Juli', number = '0482', stamps = 6, total = 10, code = 'ZRV-0482-0000', compact = false } = {}) {
  const el = document.createElement('div');
  el.className = `pass${compact ? ' pass--compact' : ''}`;
  el.innerHTML = `
    <div class="pass__top">
      <span class="pass__logo">${SVG.logo}</span>
      <span class="pass__field pass__field--r"><span class="pass__k">Sellos</span><span class="pass__v" data-p-stamps></span></span>
    </div>
    <div class="pass__strip">
      <div class="pass__grid">${Array.from({ length: total }, () => `<span class="zslot">${zSlot()}</span>`).join('')}</div>
    </div>
    <div class="pass__fields">
      <span class="pass__field"><span class="pass__k">Miembro</span><span class="pass__v" data-p-name></span></span>
      <span class="pass__field pass__field--r"><span class="pass__k">Próximo premio</span><span class="pass__v" data-p-next></span></span>
    </div>
    <div class="pass__barcode">
      <div class="pass__qr" data-p-qr></div>
      <span class="pass__code" data-p-code></span>
    </div>`;

  const q = (s) => el.querySelector(s);
  const slots = [...el.querySelectorAll('.zslot')];

  function update(s) {
    const st = s.stamps ?? stamps;
    q('[data-p-stamps]').textContent = `${st}/${total}`;
    q('[data-p-name]').textContent = s.name ?? name;
    const left = total - st;
    q('[data-p-next]').textContent = left <= 0 ? '¡Listo para canjear!' : `En ${left} ${left === 1 ? 'café' : 'cafés'}`;
    slots.forEach((z, i) => z.classList.toggle('is-on', i < st));
    const c = s.code ?? code;
    if (q('[data-p-code]').textContent !== c) {
      q('[data-p-qr]').innerHTML = qrSvg(c, { logo: false, accent: '#161513' });
      q('[data-p-code]').textContent = c;
    }
  }
  update({ name, number, stamps, code });

  return { el, update };
}
