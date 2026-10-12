// Regenera lib/zorvo/svgs.js a partir de brand/svg y brand/doodles.
// Uso: node scripts/generar-svgs.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const dirs = ['brand/svg', 'brand/doodles'];
const lines = [
  '// Generado desde los SVG de marca (manual ZORVO) y los doodles propios.',
  '// Para regenerar: node scripts/generar-svgs.mjs',
  '',
];
for (const d of dirs) {
  for (const f of readdirSync(d).filter((x) => x.endsWith('.svg')).sort()) {
    lines.push(`export const ${f.slice(0, -4)} = ${JSON.stringify(readFileSync(`${d}/${f}`, 'utf8').trim())};`);
  }
}
writeFileSync('lib/zorvo/svgs.js', lines.join('\n') + '\n');
console.log('lib/zorvo/svgs.js', lines.length - 3, 'svgs');
