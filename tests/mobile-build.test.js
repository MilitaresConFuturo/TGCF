import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist', 'mobile');

test('builds the compact mobile web bundle for Capacitor', () => {
  execFileSync(process.execPath, ['scripts/build-mobile.js'], { cwd: root, stdio: 'pipe' });

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
  assert.match(html, /src="assets\/logo-mcf-oficial-2026\.png"/);
  assert.doesNotMatch(html, /src="assets\/logo-mcf\.png"/);
  assert.match(html, /src\/ui\/compact\/app\.js/);
  assert.match(html, /<title>TGCF<\/title>/);
  assert.match(html, /id="profile-summary"/);
  assert.doesNotMatch(html, /desktop-template|Tu referencia, prueba a prueba/);
});
