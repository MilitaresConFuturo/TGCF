import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, parseDuration, formatAgility } from '../src/formatters.js';

test('parses minute-second input and formats it consistently', () => {
  assert.equal(parseDuration('2:05'), 125);
  assert.equal(parseDuration('125'), 125);
  assert.equal(parseDuration('2:75'), null);
  assert.equal(formatDuration(125), '2:05');
});

test('formats tenths of agility seconds with a decimal comma', () => {
  assert.equal(formatAgility(152), '15,2 s');
  assert.equal(formatAgility(140), '14,0 s');
});
