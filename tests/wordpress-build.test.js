import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-wordpress');

test('builds a self-contained Permanencia fragment for WordPress', () => {
  execFileSync(process.execPath, ['scripts/build-wordpress.js'], { cwd: root, stdio: 'pipe' });

  const doc = readFileSync(path.join(out, 'permanencia-standalone.html'), 'utf8');
  assert.doesNotMatch(doc, /type="module"/);
  assert.doesNotMatch(doc, /^\s*(import|export) /m);
  assert.doesNotMatch(doc, /(href|src)="\.\.?\//, 'no relative paths: WordPress cannot serve them');
  assert.doesNotMatch(doc, /<link rel="stylesheet" href="(?!https:)/, 'local stylesheets must be inlined');
  assert.match(doc, /href="https:\/\/militaresconfuturo\.es\/TGCF\/"/, 'TGCF tab points to the live calculator');
  assert.match(doc, /<base target="_top">/);
  assert.match(doc, /Máximo 15 puntos/);

  const script = doc.match(/<script>\n([\s\S]*?)\n<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(script), 'bundled script must be valid classic JavaScript');

  const fragment = readFileSync(path.join(out, 'permanencia-wordpress.html'), 'utf8');
  assert.equal(fragment.trim().split('\n').length, 1, 'single line so wpautop cannot alter it');
  assert.match(fragment, /<iframe id="mcf-permanencia-frame"[^>]* srcdoc="/);
});
