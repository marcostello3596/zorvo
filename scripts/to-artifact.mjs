// Convierte dist-artifact/index.html (documento completo, todo inline) en un
// fragmento para publicar como Artifact de Claude (el host agrega doctype/head/body).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));

const pick = (src, re) => [...src.matchAll(re)].map((m) => m[0]);
const title = pick(head, /<title>[\s\S]*?<\/title>/g);
const links = pick(head, /<link[^>]+(?:fonts\.googleapis|fonts\.gstatic)[^>]*>/g);
const styles = pick(head, /<style[\s\S]*?<\/style>/g);
const scripts = [...pick(head, /<script[\s\S]*?<\/script>/g), ...pick(body, /<script[\s\S]*?<\/script>/g)];
const bodyNoScripts = body.replace(/<script[\s\S]*?<\/script>/g, '');

const out = [...title, ...links, ...styles, bodyNoScripts.trim(), ...scripts].join('\n');
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/zorvo.html', out);
console.log(`artifact/zorvo.html  ${(out.length / 1024).toFixed(0)} KB`);
