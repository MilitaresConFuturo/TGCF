import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-wordpress');

execFileSync(process.execPath, ['scripts/build-wordpress.js'], { cwd: root, stdio: 'pipe' });

const read = (file) => readFileSync(path.join(out, file), 'utf8');

for (const [name, other] of [['permanencia', 'https://www.militaresconfuturo.es/tgcf-2027/'], ['tgcf', 'https://www.militaresconfuturo.es/permanencia/']]) {
  test(`builds a self-contained ${name} fragment for WordPress`, () => {
    const doc = read(`${name}-standalone.html`);
    assert.doesNotMatch(doc, /type="module"/);
    assert.doesNotMatch(doc, /^\s*(import|export) /m);
    assert.doesNotMatch(doc, /(href|src)="\.\.?\//, 'no relative paths: WordPress cannot serve them');
    assert.doesNotMatch(doc, /<link rel="stylesheet" href="(?!https:)/, 'local stylesheets must be inlined');
    assert.match(doc, new RegExp(`class="tool-tab" href="${other}"`), 'the other tool tab points to its WordPress page');
    assert.match(doc, /class="back-to-site" href="https:\/\/www\.militaresconfuturo\.es"/, 'back to site is kept');
    assert.match(doc, /<base target="_top">/);

    const script = doc.match(/<script>\n([\s\S]*?)\n<\/script>/)[1];
    assert.doesNotThrow(() => new vm.Script(script), 'bundled script must be valid classic JavaScript');

    const fragment = read(`${name}-wordpress.html`);
    assert.equal(fragment.trim().split('\n').length, 1, 'single line so wpautop cannot alter it');
    assert.doesNotMatch(fragment, /<iframe/i, 'no literal iframe: cookie plugins replace it with a map');
    assert.match(fragment, /createElement\('iframe'\)/);
    const boot = fragment.match(/<script>([\s\S]*)<\/script>/)[1];
    assert.doesNotThrow(() => new vm.Script(boot), 'boot script must be valid JavaScript');
  });
}

test('Permanencia fragment keeps the official 15 point cap', () => {
  assert.match(read('permanencia-standalone.html'), /Máximo 15 puntos/);
});
