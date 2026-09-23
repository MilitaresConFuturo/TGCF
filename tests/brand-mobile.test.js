import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file));
const res = 'android/app/src/main/res';

function pngDimensions(buffer) {
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test('Android launcher uses the approved full-color MCF mark on white', () => {
  const source = read('assets/android-launcher-logo.png');
  assert.equal(createHash('sha256').update(source).digest('hex'), '37318570594c4bb90e283c79d1a029beb293d55edeaf34dd8fe0ef1668fafbba');
  assert.deepEqual(pngDimensions(source), [512, 512]);
  for (const [density, size] of Object.entries({ ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    assert.deepEqual(pngDimensions(read(`${res}/mipmap-${density}/ic_launcher.png`)), [size, size]);
    assert.deepEqual(pngDimensions(read(`${res}/mipmap-${density}/ic_launcher_round.png`)), [size, size]);
  }
  const adaptive = read(`${res}/mipmap-anydpi-v26/ic_launcher.xml`).toString();
  assert.match(adaptive, /android:drawable="@mipmap\/ic_launcher_foreground"/);
  assert.doesNotMatch(adaptive, /android:inset=/);
  assert.match(read(`${res}/values/ic_launcher_background.xml`).toString(), /#FFFFFF/);
});

test('mobile presentation inherits the public TGCF brand palette without cream topbar', () => {
  const css = read('styles/compact.css').toString();
  for (const color of ['--ink: #193540', '--paper: #ffffff', '--teal: #009d7f', '--red: #bf1210', '--yellow: #e7b72a']) assert.ok(css.includes(color), color);
  assert.doesNotMatch(css, /background:\s*rgba\(246,244,239/);
  assert.doesNotMatch(css, /#f9f5ec|#e4e1da|#eceae4/);
});

test('updated Android APK has an incremented version and a parallel-installable preview ID', () => {
  const gradle = read('android/app/build.gradle').toString();
  assert.match(gradle, /versionCode\s+2\b/);
  assert.match(gradle, /applicationIdSuffix\s+["']\.preview["']/);
  assert.match(read('android/app/src/debug/res/values/strings.xml').toString(), /TGCF prueba/);
});
