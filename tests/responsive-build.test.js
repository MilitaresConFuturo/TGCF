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
    'assets/logo-mcf.png',
  ]) {
    assert.equal(existsSync(path.join(dist, relativePath)), true, relativePath);
  }

  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  const entry = readFileSync(path.join(dist, 'src', 'web-entry.js'), 'utf8');
  const logo = readFileSync(path.join(dist, 'assets', 'logo-mcf.png'));
  assert.equal(logo.readUInt32BE(16), 1149, 'the launch logo must use the official horizontal asset');
  assert.equal(logo.readUInt32BE(20), 356, 'the launch logo must use the official horizontal asset');
  assert.match(html, /src\/web-entry\.js/);
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
    'assets/logo-mcf.png',
  ]) {
    assert.equal(existsSync(path.join(dist, relativePath)), true, relativePath);
  }

  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.match(html, /src\/ui\/compact\/app\.js/);
  assert.doesNotMatch(html, /desktop-template/);
});
