import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

 test('builds a self-contained mobile web bundle', () => {
  execFileSync(process.execPath, ['scripts/build-web.js'], { cwd: root, stdio: 'pipe' });

  for (const relativePath of [
    'index.html',
    'privacy.html',
    'styles/main.css',
    'src/app.js',
    'src/calculator.js',
    'src/data/annex-ii.json',
    'assets/logo-mcf-oficial-2026.png',
  ]) {
    assert.equal(existsSync(path.join(dist, relativePath)), true, relativePath);
  }

  const logo = readFileSync(path.join(dist, 'assets', 'logo-mcf-oficial-2026.png'));
  assert.equal(logo.readUInt32BE(16), 1149, 'the deployed logo must use the official horizontal asset');
  assert.equal(logo.readUInt32BE(20), 356, 'the deployed logo must use the official horizontal asset');

  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  const css = readFileSync(path.join(dist, 'styles', 'main.css'), 'utf8').toLowerCase();
  assert.match(html, /src="assets\/logo-mcf-oficial-2026\.png"/);
  assert.doesNotMatch(html, /src="assets\/logo-mcf\.png"/);
  assert.match(html, /src\/app\.js\?v=10/);
  assert.match(html, /styles\/main\.css\?v=19/);
  assert.match(html, /<title>TGCF<\/title>/);
  assert.match(html, /theme-color" content="#193540"/);
  assert.match(html, /family=Heebo:wght@400;600;700&family=Poppins:wght@400;600/);
  for (const color of ['#009d7f', '#193540', '#1e1e1e', '#ffffff', '#f2f4f5', '#dce1e3', '#bf1210', '#e7b72a']) {
    assert.match(css, new RegExp(color), `missing corporate color ${color}`);
  }
  assert.match(css, /--text:\s*#1e1e1e/);
  assert.match(css, /--blue-pale:\s*var\(--alt\)/);
  assert.match(css, /h1, h2, h3[^}]*\{[^}]*color:\s*var\(--ink\)/s);
  assert.match(css, /\.report-copy h2\s*\{[^}]*color:\s*#fff/s);
  assert.match(css, /\.mode\s*\{[^}]*border:\s*2px solid var\(--teal\)[^}]*border-radius:\s*5px[^}]*background:\s*transparent[^}]*color:\s*var\(--teal\)[^}]*font:\s*600[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.baremo-button, \.profile-edit, \.outline-button\s*\{[^}]*border:\s*2px solid var\(--teal\)[^}]*border-radius:\s*5px[^}]*background:\s*transparent[^}]*color:\s*var\(--teal\)[^}]*font:\s*600[^}]*text-transform:\s*uppercase/s);
  assert.match(css, /\.close-button\s*\{[^}]*border:\s*2px solid var\(--teal\)[^}]*border-radius:\s*5px[^}]*background:\s*transparent[^}]*color:\s*var\(--teal\)/s);
  assert.match(css, /\.baremo-button:hover[^}]*\{[^}]*border-color:\s*var\(--ink\)[^}]*background:\s*var\(--ink\)[^}]*color:\s*#fff/s);
  assert.match(css, /\.eyebrow\s*\{[^}]*color:\s*var\(--teal\)[^}]*font:\s*400[^}]*text-transform:\s*uppercase/s);
  assert.match(html, /id="profile-summary"/);
  assert.doesNotMatch(html, /id="mobile-progress-label"/);
  assert.doesNotMatch(html, /Preparación física|Tu referencia, prueba a prueba|El baremo que te corresponde|-[Rr]eference/);
});
