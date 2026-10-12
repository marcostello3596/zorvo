// Estado del cliente (demo). En producción esto vive en el backend y el pase
// de Apple Wallet se actualiza por push; acá se guarda en el navegador.
const KEY = 'zorvo-club-v1';
export const TOTAL = 10;
export const MENU = ['Cold brew', 'Cold brew tonic', 'Flat white', 'Espresso doble', 'Cortado', 'Latte', 'Cold brew con leche'];

function daysAgo(d, h, m) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, m, 0, 0);
  return t.getTime();
}

export function demoState() {
  return {
    demo: true,
    name: 'Juli',
    number: '0482',
    stamps: 6,
    cards: 1,
    history: [
      { t: daysAgo(0, 8, 42), item: 'Cold brew', type: 'z' },
      { t: daysAgo(1, 17, 10), item: 'Flat white', type: 'z' },
      { t: daysAgo(3, 8, 31), item: 'Cold brew tonic', type: 'z' },
      { t: daysAgo(6, 9, 5), item: 'Cortado', type: 'z' },
      { t: daysAgo(8, 16, 48), item: 'Cold brew', type: 'z' },
      { t: daysAgo(11, 8, 20), item: 'Espresso doble', type: 'z' },
      { t: daysAgo(14, 8, 55), item: 'Café de regalo', type: 'reward' },
      { t: daysAgo(16, 17, 30), item: 'Cold brew con leche', type: 'z' },
      { t: daysAgo(19, 8, 40), item: 'Cold brew', type: 'z' },
      { t: daysAgo(23, 9, 12), item: 'Latte', type: 'z' },
    ],
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && typeof s.stamps === 'number' ? s : null;
  } catch { return null; }
}

function write(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* modo privado o storage bloqueado */ }
}

let state = read() || demoState();
const subs = new Set();

export const store = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch };
    write(state);
    subs.forEach((fn) => fn(state));
  },
  reset() {
    state = demoState();
    write(state);
    subs.forEach((fn) => fn(state));
  },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
};

export function memberCode(s = state, slot = Math.floor(Date.now() / 30000)) {
  // Código rotativo cada 30 s (en producción: TOTP firmado por el servidor)
  const n = (slot * 7919 + parseInt(s.number, 10) * 104729) % 10000;
  return `ZRV-${s.number}-${String(n).padStart(4, '0')}`;
}

export function randomItem() {
  return MENU[Math.floor(Math.random() * MENU.length)];
}
