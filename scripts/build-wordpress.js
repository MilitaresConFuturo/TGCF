import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Builds the Permanencia calculator as a single fragment that can be pasted
// into a WordPress "Custom HTML" block (or Elementor HTML widget). The live
// /TGCF/ folder sits outside WordPress and cannot be written without hosting
// access, so this page has to live inside WordPress itself.
//
// The whole app runs inside an <iframe srcdoc> so the theme's CSS cannot
// break the calculator and the calculator's CSS cannot leak into the site.
// Everything is inlined (styles, data, scripts) except the Google Fonts;
// the logo is embedded as a data URI so nothing else has to load.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-wordpress');
const permanencia = path.join(root, 'permanencia');

const SITE = 'https://www.militaresconfuturo.es';
const TGCF_URL = 'https://militaresconfuturo.es/TGCF/';
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&family=Poppins:wght@400;600&display=swap">';

// Module order matters: each module only uses the ones listed before it.
const MODULES = [
  'src/data/anexo-iii.js',
  'src/formatters.js',
  'src/time-inputs.js',
  'src/storage.js',
  'src/calculator.js',
  'src/app.js',
];

async function bundleScripts() {
  const parts = [];
  for (const relativePath of MODULES) {
    let source = await readFile(path.join(permanencia, relativePath), 'utf8');
    source = source
      .replace(/^import .*;\r?\n/gm, '')
      .replace(/^export default /m, 'const data = ')
      .replace(/^export /gm, '');
    parts.push(`// ${relativePath}\n${source}`);
  }
  return `(function () {\n'use strict';\n${parts.join('\n')}\n})();`;
}

function replaceOnce(html, search, replacement) {
  if (!html.includes(search)) throw new Error(`Expected to find: ${search}`);
  return html.replace(search, replacement);
}

async function buildDocument() {
  let html = await readFile(path.join(permanencia, 'index.html'), 'utf8');
  const mainCss = await readFile(path.join(root, 'styles', 'main.css'), 'utf8');
  const permanenciaCss = await readFile(path.join(permanencia, 'styles', 'permanencia.css'), 'utf8');
  const script = await bundleScripts();

  html = html.replace(/<link rel="stylesheet" href="\.\.\/assets\/fonts\/fonts\.css">/, FONTS);
  html = html.replace(/<link rel="stylesheet" href="\.\.\/styles\/main\.css[^"]*">/, `<style>\n${mainCss}\n</style>`);
  html = html.replace(/<link rel="stylesheet" href="styles\/permanencia\.css[^"]*">/, `<style>\n${permanenciaCss}\n</style>`);
  // Links leave the iframe and open in the whole browser tab.
  html = replaceOnce(html, '</head>', '<base target="_top">\n</head>');
  const logo = await readFile(path.join(root, 'assets', 'logo-mcf-oficial-2026.png'));
  html = replaceOnce(html, 'src="../assets/logo-mcf-oficial-2026.png"', `src="data:image/png;base64,${logo.toString('base64')}"`);
  html = replaceOnce(html, '<a class="brand" href="#inicio"', '<a class="brand" href="#inicio" target="_self"');
  html = replaceOnce(html, 'href="../index.html"', `href="${TGCF_URL}"`);
  html = html.replace(/<a class="tool-tab active" href="[^"]*"/, '<a class="tool-tab active" href="#inicio" target="_self"');
  html = html.replace(/href="https:\/\/www\.militaresconfuturo\.es"/g, `href="${SITE}"`);
  html = html.replace(/<script type="module" src="src\/app\.js[^"]*"><\/script>/, `<script>\n${script}\n</script>`);
  return html;
}

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '&#10;');
}

// One line, so WordPress' automatic paragraphs cannot inject <p>/<br> tags.
function buildFragment(documentHtml) {
  const resize = "(function(){var f=document.getElementById('mcf-permanencia-frame');if(!f)return;function fit(){try{var d=f.contentDocument;if(d&&d.documentElement){f.style.height=d.documentElement.scrollHeight+'px';}}catch(e){}}f.addEventListener('load',function(){fit();try{new ResizeObserver(fit).observe(f.contentDocument.documentElement);}catch(e){setInterval(fit,1000);}});})();";
  return `<!-- MCF Permanencia 2026: generado por scripts/build-wordpress.js, no editar a mano --><div class="mcf-permanencia-embed" style="width:100%;max-width:100%;margin:0 auto;"><iframe id="mcf-permanencia-frame" title="Calculadora de pruebas físicas de Permanencia 2026" style="display:block;width:100%;min-height:900px;border:0;" srcdoc="${escapeAttribute(documentHtml)}"></iframe></div><script>${resize}</script>\n`;
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const documentHtml = await buildDocument();
await writeFile(path.join(out, 'permanencia-standalone.html'), documentHtml, 'utf8');
await writeFile(path.join(out, 'permanencia-wordpress.html'), buildFragment(documentHtml), 'utf8');
console.log(`WordPress fragment ready: ${path.relative(root, out)}`);
