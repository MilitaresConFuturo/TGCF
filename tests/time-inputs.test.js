import test from 'node:test';
import assert from 'node:assert/strict';
import { durationFromParts, durationToParts } from '../src/time-inputs.js';

test('builds a duration from separate minute and second fields', () => {
  assert.equal(durationFromParts('1', '30'), 90);
  assert.equal(durationFromParts('0', '05'), 5);
  assert.equal(durationFromParts('', ''), null);
});

test('rejects incomplete or out-of-range duration fields', () => {
  assert.equal(durationFromParts('1', ''), null);
  assert.equal(durationFromParts('', '30'), null);
  assert.equal(durationFromParts('1', '60'), null);
  assert.equal(durationFromParts('100', '00'), null);
  assert.equal(durationFromParts('-1', '30'), null);
});

test('accepts an optional official upper limit for a duration', () => {
  assert.equal(durationFromParts('5', '15', { maxSeconds: 315 }), 315);
  assert.equal(durationFromParts('5', '16', { maxSeconds: 315 }), null);
});

test('splits total seconds into mobile-friendly fields', () => {
  assert.deepEqual(durationToParts(90), { minutes: '1', seconds: '30' });
  assert.deepEqual(durationToParts(5), { minutes: '0', seconds: '05' });
  assert.deepEqual(durationToParts(null), { minutes: '', seconds: '' });
});
