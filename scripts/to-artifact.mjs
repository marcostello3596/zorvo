// Arma artifact/zorvo.html: toma dist-artifact/ (1 JS + 1 CSS), los mete inline
// y saca doctype/head/body (el host de Claude agrega el esqueleto).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact';
let html = readFileSync(join(dir, 'index.html'), 'utf8');
const read = (href) => readFileSync(join(dir, href.replace(/^\//, '')), 'utf8');

// CSS y JS del build -> inline
html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => `<style>${read(href)}</style>`);
html = html.replace(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, src) =>
  `<script type="module">${read(src).replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');

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
