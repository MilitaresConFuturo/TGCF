import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(script) {
  execFileSync(process.execPath, [`scripts/${script}`], { cwd: root, stdio: 'pipe' });
}

test('builds a responsive web bundle with desktop and compact presentations', () => {
  run('build-web.js');
  const dist = path.join(root, 'dist', 'web');

  for (const relativePath of [
    'index.html',
    'privacy.html',
    'styles/desktop.css',
    'styles/compact.css',
    'src/web-entry.js',
    'src/ui/desktop/app.js',
    'src/ui/compact/app.js',
    'src/core/calculator.js',
    'src/core/data/annex-ii.json',
    'assets/logo-mcf-oficial-2026.png',
  ]) {
    assert.equal(existsSync(path.join(dist, relativePath)), true, relativePath);
  }

  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  const entry = readFileSync(path.join(dist, 'src', 'web-entry.js'), 'utf8');
  const desktopTemplate = readFileSync(path.join(dist, 'src', 'ui', 'desktop', 'template.html'), 'utf8');
  const compactTemplate = readFileSync(path.join(dist, 'src', 'ui', 'compact', 'template.html'), 'utf8');
  const desktopCss = readFileSync(path.join(dist, 'styles', 'desktop.css'), 'utf8').toLowerCase();
  const compactCss = readFileSync(path.join(dist, 'styles', 'compact.css'), 'utf8').toLowerCase();
  const logo = readFileSync(path.join(dist, 'assets', 'logo-mcf-oficial-2026.png'));
  assert.equal(logo.readUInt32BE(16), 1149, 'the launch logo must use the official horizontal asset');
  assert.equal(logo.readUInt32BE(20), 356, 'the launch logo must use the official horizontal asset');
  assert.match(html, /family=Heebo:wght@400;600;700&family=Poppins:wght@400;600/);
  assert.match(html, /theme-color" content="#193540"/);
  for (const template of [desktopTemplate, compactTemplate]) {
    assert.match(template, /src="assets\/logo-mcf-oficial-2026\.png"/);
    assert.doesNotMatch(template, /src="assets\/logo-mcf\.png"/);
    assert.match(template, /class="back-to-site" href="https:\/\/www\.militaresconfuturo\.es">Volver a la web<\/a>/);
  }
  for (const css of [desktopCss, compactCss]) {
    for (const color of ['#009d7f', '#193540', '#1e1e1e', '#ffffff', '#f2f4f5', '#dce1e3', '#bf1210', '#e7b72a']) {
      assert.match(css, new RegExp(color), `missing corporate color ${color}`);
    }
    assert.match(css, /--mono:\s*"heebo"/);
    assert.match(css, /--sans:\s*"poppins"/);
    assert.match(css, /\.back-to-site\s*\{[^}]*border:\s*2px solid var\(--teal\)[^}]*border-radius:\s*5px[^}]*background:\s*transparent[^}]*color:\s*var\(--teal\)/s);
    assert.match(css, /\.back-to-site:hover[^}]*\{[^}]*border-color:\s*var\(--ink\)[^}]*background:\s*var\(--ink\)[^}]*color:\s*#fff/s);
    assert.match(css, /\.eyebrow\s*\{[^}]*text-transform:\s*uppercase[^}]*color:\s*var\(--teal\)/s);
  }
  assert.match(html, /src\/web-entry\.js/);
  assert.doesNotMatch(html, /Tu referencia,\s*<em>prueba a prueba\.<\/em>/);
  assert.doesNotMatch(html, /intro-logo/);
  assert.match(entry, /src\/ui\/\$\{mode\}\/template\.html/);
  assert.match(entry, /styles\/\$\{mode\}\.css/);
});

test('builds the compact presentation as the Capacitor mobile bundle', () => {
  run('build-mobile.js');
  const dist = path.join(root, 'dist', 'mobile');

  for (const relativePath of [
    'index.html',
    'privacy.html',
    'styles/compact.css',
    'src/ui/compact/app.js',
    'src/core/calculator.js',
    'src/core/data/annex-ii.json',
    'assets/logo-mcf-oficial-2026.png',
  ]) {
    assert.equal(existsSync(path.join(dist, relativePath)), true, relativePath);
  }

  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  const compactCss = readFileSync(path.join(dist, 'styles', 'compact.css'), 'utf8').toLowerCase();
  assert.match(html, /src\/ui\/compact\/app\.js/);
  assert.match(html, /family=Heebo:wght@400;600;700&family=Poppins:wght@400;600/);
  assert.match(html, /theme-color" content="#193540"/);
  assert.match(html, /class="back-to-site" href="https:\/\/www\.militaresconfuturo\.es">Volver a la web<\/a>/);
  assert.match(compactCss, /--text:\s*#1e1e1e/);
  assert.doesNotMatch(html, /desktop-template/);
});
