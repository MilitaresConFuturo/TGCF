import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ios = path.join(root, 'ios', 'App');
const project = readFileSync(path.join(ios, 'App.xcodeproj', 'project.pbxproj'), 'utf8');
const plist = readFileSync(path.join(ios, 'App', 'Info.plist'), 'utf8');
const capacitor = JSON.parse(readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));

test('iOS uses TGCF MCF branding and the planned identifier with version 1.2', () => {
  assert.equal(capacitor.appId, 'es.militaresconfuturo.tgcf');
  assert.match(plist, /<key>CFBundleDisplayName<\/key>\s*<string>TGCF MCF<\/string>/);
  assert.equal((project.match(/PRODUCT_BUNDLE_IDENTIFIER = es\.militaresconfuturo\.tgcf;/g) || []).length, 2);
  assert.equal((project.match(/MARKETING_VERSION = 1\.2;/g) || []).length, 2);
  assert.equal((project.match(/CURRENT_PROJECT_VERSION = 1;/g) || []).length, 2);
});

test('iOS simulator CI stays manual, unsigned and without distribution', () => {
  const workflow = readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');
  assert.match(workflow, /instance_type: mac_mini_m2/);
  assert.match(workflow, /events: \[\]/);
  assert.match(workflow, /npx cap sync ios/);
  assert.match(workflow, /CODE_SIGNING_ALLOWED=NO build/);
  assert.match(workflow, /simctl install/);
  assert.match(workflow, /simctl launch/);
  assert.doesNotMatch(workflow, /^\s+publishing:/m);
  assert.doesNotMatch(workflow, /^\s+- .*\.ipa\s*$/m);
});

test('iOS has branded icon, launch assets and a local-only handoff', () => {
  const iconDir = path.join(ios, 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  const images = JSON.parse(readFileSync(path.join(iconDir, 'Contents.json'), 'utf8')).images;
  assert.ok(images.some((image) => image.size === '1024x1024' && existsSync(path.join(iconDir, image.filename))));
  assert.equal(existsSync(path.join(ios, 'App', 'Assets.xcassets', 'Splash.imageset', 'Contents.json')), true);
  assert.equal(existsSync(path.join(root, 'docs', 'ios-local.md')), true);
});
