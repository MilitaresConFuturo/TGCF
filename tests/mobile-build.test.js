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
    'assets/logo-mcf.png',
  ]) {
    assert.equal(existsSync(path.join(dist, relativePath)), true, relativePath);
  }

  const logo = readFileSync(path.join(dist, 'assets', 'logo-mcf.png'));
  assert.equal(logo.readUInt32BE(16), 1149, 'the deployed logo must use the official horizontal asset');
  assert.equal(logo.readUInt32BE(20), 356, 'the deployed logo must use the official horizontal asset');

  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.match(html, /src\/app\.js\?v=10/);
  assert.match(html, /<title>TGCF<\/title>/);
  assert.match(html, /id="profile-summary"/);
  assert.doesNotMatch(html, /id="mobile-progress-label"/);
  assert.doesNotMatch(html, /Preparación física|Tu referencia, prueba a prueba|El baremo que te corresponde|-[Rr]eference/);
});
