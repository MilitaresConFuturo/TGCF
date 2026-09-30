import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-hosting');

test('hosting folder ships only the web files and links both tools with relative paths', () => {
  execFileSync(process.execPath, ['scripts/build-hosting.js'], { cwd: root, stdio: 'pipe' });

  assert.deepEqual(readdirSync(out).sort(), ['assets', 'index.html', 'permanencia', 'privacy.html', 'src', 'styles']);
  for (const forbidden of ['android', 'ios', 'tests', 'scripts', 'node_modules', 'package.json']) {
    assert.equal(existsSync(path.join(out, forbidden)), false, `${forbidden} must not be uploaded`);
  }

  const tgcf = readFileSync(path.join(out, 'index.html'), 'utf8');
  const permanencia = readFileSync(path.join(out, 'permanencia', 'index.html'), 'utf8');
  assert.match(tgcf, /<a class="tool-tab" href="permanencia\/index\.html">Permanencia 2026<\/a>/);
  assert.match(permanencia, /<a class="tool-tab" href="\.\.\/index\.html">TGCF 2027<\/a>/);
  const privacy = readFileSync(path.join(out, 'privacy.html'), 'utf8');
  assert.match(privacy, /TGCF 2027/);
  assert.match(privacy, /Permanencia 2026/);
  assert.match(permanencia, /<a href="\.\.\/privacy\.html">Política de privacidad<\/a>/);
  for (const html of [tgcf, permanencia]) {
    assert.doesNotMatch(html, /(href|src)="\//, 'no root-absolute paths: the folder must work under any name');
    assert.match(html, /class="back-to-site" href="https:\/\/www\.militaresconfuturo\.es"/);
  }
});
