import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const relativePath of ['index.html', 'privacy.html', 'styles', 'src', 'assets', 'permanencia']) {
  await cp(path.join(root, relativePath), path.join(dist, relativePath), { recursive: true });
}

// Inline every local <link rel="stylesheet"> into a <style> tag directly in
// the HTML. The packaged Android WebView has shown unreliable loading of
// external stylesheets (blank/unstyled pages on some devices even though the
// files are present and served correctly by a plain HTTP server). Inlining
// removes that failure mode entirely: the styles ship with the document, no
// separate request can fail, be blocked, or race the WebView's asset loader.
async function inlineStylesheets(htmlPath) {
  const htmlDir = path.dirname(htmlPath);
  let html = await readFile(htmlPath, 'utf8');
  const linkRe = /<link rel="stylesheet" href="([^"]+)">/g;
  let match;
  const replacements = [];
  while ((match = linkRe.exec(html))) {
    const [full, href] = match;
    if (/^https?:\/\//.test(href)) continue; // leave remote links (none expected) untouched
    const cssPath = path.join(htmlDir, href.split('?')[0]);
    let css = await readFile(cssPath, 'utf8');
    // Also inline any local font url(...) references as base64 data URIs so
    // fonts never depend on a second successful file request either.
    const fontUrlRe = /url\('([^']+\.ttf)'\)/g;
    let fontMatch;
    const fontReplacements = [];
    while ((fontMatch = fontUrlRe.exec(css))) {
      const [fFull, fHref] = fontMatch;
      const fontPath = path.join(path.dirname(cssPath), fHref);
      const fontData = await readFile(fontPath);
      fontReplacements.push([fFull, `url('data:font/ttf;base64,${fontData.toString('base64')}')`]);
    }
    for (const [fFull, dataUri] of fontReplacements) {
      css = css.replace(fFull, dataUri);
    }
    replacements.push([full, `<style>\n${css}\n</style>`]);
  }
  for (const [full, styleTag] of replacements) {
    html = html.replace(full, styleTag);
  }
  await writeFile(htmlPath, html, 'utf8');
}

await inlineStylesheets(path.join(dist, 'index.html'));
await inlineStylesheets(path.join(dist, 'permanencia', 'index.html'));

console.log(`Web bundle ready: ${path.relative(root, dist)}`);
