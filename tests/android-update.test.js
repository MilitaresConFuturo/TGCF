import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gradle = readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');

test('release updates the existing signed TGCF package instead of creating a new app', () => {
  assert.match(gradle, /applicationId\s+"es\.militaresconfuturo\.tgcf"/);
  assert.match(gradle, /versionCode\s+3\b/);
  assert.match(gradle, /versionName\s+"1\.2"/);
  assert.match(gradle, /TGCF_SIGNING_FILE/);
  assert.match(gradle, /TGCF_SIGNING_PASSWORD/);
  assert.doesNotMatch(gradle, /keystorePropertiesFile/);
});

test('debug preview is isolated while the release keeps the existing identity', () => {
  assert.match(gradle, /debug\s*\{[^}]*applicationIdSuffix\s+'\.preview'/s);
  assert.match(gradle, /release\s*\{[^}]*signingConfig\s+signingConfigs\.release/s);
});

test('Android release keeps the established launcher artwork and offline signing contract', () => {
  assert.equal(existsSync(path.join(root, 'assets/android-launcher-logo.png')), true);
  assert.equal(existsSync(path.join(root, 'scripts/tgcf-signing.py')), true);
  const signing = readFileSync(path.join(root, 'scripts/tgcf-signing.py'), 'utf8');
  assert.match(signing, /e5663f7ef8b731cbf744fe5eba3bf9265811857d89fd0ce9194ef7e4a2cc1fa8/);
  assert.match(signing, /int\(version\.group\(1\)\) <= 2/);
  const ignores = readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(ignores, /^\*\.p12$/m);
  assert.match(ignores, /^\*\.dpapi$/m);
});
