import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Builds TGCF and Permanencia as single fragments that can be pasted into a
// WordPress "Custom HTML" block on a page that uses the "Elementor Canvas"
// template (blank page: no site header/footer, so it looks like the app).
// The live /TGCF/ folder sits outside WordPress and cannot be written without
// hosting access, so both tools live inside WordPress itself.
//
// Each app runs inside an <iframe srcdoc> so the theme's CSS cannot break the
// calculator and the calculator's CSS cannot leak into the site. Everything is
// inlined (styles, data, scripts) except the Google Fonts; the logo is embedded
// as a data URI so nothing else has to load.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-wordpress');

const SITE = 'https://www.militaresconfuturo.es';
// Final addresses of the two WordPress pages (slug tgcf-2027 avoids the
// /TGCF/ folder that still exists on the hosting).
const TGCF_URL = `${SITE}/tgcf-2027/`;
const PERMANENCIA_URL = `${SITE}/permanencia/`;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&family=Poppins:wght@400;600&display=swap">';
const LOGO = 'assets/logo-mcf-oficial-2026.png';

// Module order matters: each module only uses the ones listed before it.
const TOOLS = {
  permanencia: {
    dir: 'permanencia',
    modules: ['src/data/anexo-iii.js', 'src/formatters.js', 'src/time-inputs.js', 'src/storage.js', 'src/calculator.js', 'src/app.js'],
    extraCss: ['permanencia/styles/permanencia.css'],
    fontsLink: '<link rel="stylesheet" href="../assets/fonts/fonts.css">',
    mainCssLink: /<link rel="stylesheet" href="\.\.\/styles\/main\.css[^"]*">/,
    extraCssLink: /<link rel="stylesheet" href="styles\/permanencia\.css[^"]*">/,
    logoSrc: `src="../${LOGO}"`,
    otherToolHref: 'href="../index.html"',
    otherToolUrl: TGCF_URL,
    fragmentFile: 'permanencia-wordpress.html',
    standaloneFile: 'permanencia-standalone.html',
    rootId: 'mcf-permanencia-embed',
    frameId: 'mcf-permanencia-frame',
    title: 'Calculadora de pruebas físicas de Permanencia 2026',
  },
  tgcf: {
    dir: '.',
    modules: ['src/data/annex-ii.js', 'src/reference-options.js', 'src/formatters.js', 'src/time-inputs.js', 'src/storage.js', 'src/calculator.js', 'src/app.js'],
    extraCss: ['permanencia/styles/permanencia.css'],
    fontsLink: '<link rel="stylesheet" href="assets/fonts/fonts.css">',
    mainCssLink: /<link rel="stylesheet" href="styles\/main\.css[^"]*">/,
    extraCssLink: /<link rel="stylesheet" href="permanencia\/styles\/permanencia\.css[^"]*">/,
    logoSrc: `src="${LOGO}"`,
    otherToolHref: 'href="permanencia/index.html"',
    otherToolUrl: PERMANENCIA_URL,
    fragmentFile: 'tgcf-wordpress.html',
    standaloneFile: 'tgcf-standalone.html',
    rootId: 'mcf-tgcf-embed',
    frameId: 'mcf-tgcf-frame',
    title: 'Calculadora de pruebas físicas TGCF',
  },
};

async function bundleScripts(tool) {
  const parts = [];
  for (const relativePath of tool.modules) {
    let source = await readFile(path.join(root, tool.dir, relativePath), 'utf8');
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
  return html.replace(search, () => replacement);
}

async function buildDocument(tool) {
  let html = await readFile(path.join(root, tool.dir, 'index.html'), 'utf8');
  const mainCss = await readFile(path.join(root, 'styles', 'main.css'), 'utf8');
  const extraCss = (await Promise.all(tool.extraCss.map((file) => readFile(path.join(root, file), 'utf8')))).join('\n');
  const script = await bundleScripts(tool);

  html = replaceOnce(html, tool.fontsLink, FONTS);
  html = html.replace(tool.mainCssLink, () => `<style>\n${mainCss}\n</style>`);
  html = html.replace(tool.extraCssLink, () => `<style>\n${extraCss}\n</style>`);
  // Links leave the iframe and open in the whole browser tab.
  html = replaceOnce(html, '</head>', '<base target="_top">\n</head>');
  const logo = await readFile(path.join(root, LOGO));
  html = replaceOnce(html, tool.logoSrc, `src="data:image/png;base64,${logo.toString('base64')}"`);
  html = replaceOnce(html, '<a class="brand" href="#inicio"', '<a class="brand" href="#inicio" target="_self"');
  html = replaceOnce(html, tool.otherToolHref, `href="${tool.otherToolUrl}"`);
  html = html.replace(/<a class="tool-tab active" href="[^"]*"/, '<a class="tool-tab active" href="#inicio" target="_self"');
  html = html.replace(/href="https:\/\/www\.militaresconfuturo\.es"/g, `href="${SITE}"`);
  html = html.replace(/<script type="module" src="src\/app\.js[^"]*"><\/script>/, () => `<script>\n${script}\n</script>`);
  return html;
}

// Keeps the JSON string from closing the <script> early or breaking on
// characters that are not valid in JavaScript source.
function escapeForScript(json) {
  const bs = String.fromCharCode(92);
  return json
    .replaceAll('<', `${bs}u003c`)
    .replaceAll('>', `${bs}u003e`)
    .replaceAll('&', `${bs}u0026`)
    .replaceAll(String.fromCharCode(0x2028), `${bs}u2028`)
    .replaceAll(String.fromCharCode(0x2029), `${bs}u2029`);
}

// One line, so WordPress' automatic paragraphs cannot inject <p>/<br> tags.
// The iframe is created by script: a literal <iframe> without src gets hijacked
// by Complianz (cookie plugin) and replaced with the Google Maps placeholder.
function buildFragment(tool, documentHtml) {
  const payload = escapeForScript(JSON.stringify(documentHtml));
  const title = escapeForScript(JSON.stringify(tool.title));
  const boot = `(function(){var root=document.getElementById('${tool.rootId}');if(!root)return;var f=document.createElement('iframe');f.id='${tool.frameId}';f.title=${title};f.style.cssText='display:block;width:100%;min-height:900px;border:0;';function fit(){try{var d=f.contentDocument;if(d&&d.documentElement){f.style.height=d.documentElement.scrollHeight+'px';}}catch(e){}}f.addEventListener('load',function(){fit();try{new ResizeObserver(fit).observe(f.contentDocument.documentElement);}catch(e){setInterval(fit,1000);}});f.srcdoc=${payload};root.appendChild(f);})();`;
  return `<!-- MCF ${tool.title}: generado por scripts/build-wordpress.js, no editar a mano --><div id="${tool.rootId}" style="width:100%;max-width:100%;margin:0 auto;"></div><script>${boot}</script>\n`;
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const tool of Object.values(TOOLS)) {
  const documentHtml = await buildDocument(tool);
  await writeFile(path.join(out, tool.standaloneFile), documentHtml, 'utf8');
  await writeFile(path.join(out, tool.fragmentFile), buildFragment(tool, documentHtml), 'utf8');
}
console.log(`WordPress fragments ready: ${path.relative(root, out)}`);
