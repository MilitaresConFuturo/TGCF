import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/core/data/annex-ii.json' with { type: 'json' };
import { officialMarkBounds, officialReferenceMarks } from '../src/core/reference-options.js';

test('lists each official mark once in ascending order for a picker', () => {
  assert.deepEqual(officialReferenceMarks(data.tests.flex).slice(0, 3), [0, 1, 2]);
  assert.deepEqual(officialReferenceMarks(data.tests.flex).slice(-3), [71, 72, 73]);
  assert.equal(officialReferenceMarks(data.tests.plank).length, 84);
  assert.equal(officialReferenceMarks(data.tests.run).length, 73);
  assert.equal(officialReferenceMarks(data.tests.agility).length, 75);
});

test('returns the actual official limits of each published table', () => {
  assert.deepEqual(officialMarkBounds(data.tests.flex), { min: 0, max: 73 });
  assert.deepEqual(officialMarkBounds(data.tests.plank), { min: 15, max: 315 });
  assert.deepEqual(officialMarkBounds(data.tests.run), { min: 386, max: 1014 });
  assert.deepEqual(officialMarkBounds(data.tests.agility), { min: 116, max: 190 });
});
