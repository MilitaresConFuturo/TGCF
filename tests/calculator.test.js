import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/core/data/annex-ii.json' with { type: 'json' };
import { ageBandIndex, calculateScore, minimumMarkForPoints, normalizeAgilityTenths, evaluate } from '../src/core/calculator.js';

test('uses the official age bands at each boundary', () => {
  assert.equal(ageBandIndex(17), 0);
  assert.equal(ageBandIndex(25), 0);
  assert.equal(ageBandIndex(26), 1);
  assert.equal(ageBandIndex(45), 4);
  assert.equal(ageBandIndex(46), 5);
  assert.equal(ageBandIndex(60), 8);
});

test('scores higher-is-better flexions by the exact published table row', () => {
  assert.equal(calculateScore(data.tests.flex, { age: 30, sex: 'M', value: 45 }), 74);
  assert.equal(calculateScore(data.tests.flex, { age: 30, sex: 'M', value: 44 }), 72);
  assert.equal(calculateScore(data.tests.flex, { age: 30, sex: 'M', value: 0 }), 1);
});

test('scores lower-is-better agility and drops centiseconds to the lower tenth', () => {
  assert.equal(normalizeAgilityTenths(14.09), 140);
  assert.equal(normalizeAgilityTenths(15.29), 152);
  assert.equal(calculateScore(data.tests.agility, { age: 25, sex: 'M', value: normalizeAgilityTenths(15.29) }), 20);
  assert.equal(calculateScore(data.tests.agility, { age: 25, sex: 'M', value: normalizeAgilityTenths(15.30) }), 19);
});

test('returns the official maximum or minimum mark required for a target', () => {
  assert.equal(minimumMarkForPoints(data.tests.agility, { age: 25, sex: 'M', points: 20 }), 152);
  assert.equal(minimumMarkForPoints(data.tests.flex, { age: 30, sex: 'M', points: 20 }), 13);
});

test('requires 20 points in each applicable test, never a compensating average', () => {
  const result = evaluate({ age: 25, sex: 'M', values: { flex: 73, plank: 315, run: 386, agility: 15.3 } }, data.tests);
  assert.equal(result.status, 'NO APTO');
  assert.equal(result.tests.agility.score, 19);
  assert.equal(result.average > 20, true);
});
