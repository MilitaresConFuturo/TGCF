import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../permanencia/src/data/anexo-iii.json' with { type: 'json' };
import { calculateScore, rangeLabelFor, totalFromScores } from '../permanencia/src/calculator.js';

test('scores flexions by sex-specific bands, higher-is-better', () => {
  assert.equal(calculateScore(data.tests.flex, 'M', 56), 5);
  assert.equal(calculateScore(data.tests.flex, 'M', 55), 4);
  assert.equal(calculateScore(data.tests.flex, 'M', 10), 0);
  assert.equal(calculateScore(data.tests.flex, 'F', 38), 5);
  assert.equal(calculateScore(data.tests.flex, 'F', 37), 4);
});

test('scores the 2000m run as lower-is-better in seconds', () => {
  // 6:50 = 410s -> 5 puntos; 6:52 = 412s -> 4 puntos
  assert.equal(calculateScore(data.tests.run, 'M', 410), 5);
  assert.equal(calculateScore(data.tests.run, 'M', 412), 4);
  assert.equal(calculateScore(data.tests.run, 'M', 800), 0);
});

test('scores agility in tenths of a second, lower-is-better', () => {
  // 12,7s = 127 tenths -> 5 puntos; 12,8s = 128 -> 4 puntos
  assert.equal(calculateScore(data.tests.agility, 'M', 127), 5);
  assert.equal(calculateScore(data.tests.agility, 'M', 128), 4);
});

test('returns the official range label for a given value', () => {
  assert.equal(rangeLabelFor(data.tests.flex, 'M', 40), '34–43');
  assert.equal(rangeLabelFor(data.tests.run, 'F', 600), '9:15–10:34');
});

test('caps the total at 15 even if the raw sum reaches 20', () => {
  const allFives = [5, 5, 5, 5];
  const result = totalFromScores(allFives);
  assert.equal(result.sum, 20);
  assert.equal(result.computed, 15);
  assert.equal(result.complete, true);
});

test('does not cap when the raw sum is already at or below 15', () => {
  const result = totalFromScores([5, 4, 3, 3]);
  assert.equal(result.sum, 15);
  assert.equal(result.computed, 15);
});

test('marks incomplete when any of the four tests is missing', () => {
  const result = totalFromScores([5, 4, NaN, 3]);
  assert.equal(result.complete, false);
});

test('in APL mode, only the provided tests are summed, missing ones do not block the total', () => {
  const result = totalFromScores([5, 4, NaN, NaN], { aplMode: true });
  assert.equal(result.sum, 9);
  assert.equal(result.computed, 9);
  assert.equal(result.complete, true);
});

test('in APL mode, an all-missing set is still incomplete', () => {
  const result = totalFromScores([NaN, NaN, NaN, NaN], { aplMode: true });
  assert.equal(result.complete, false);
});

test('APL mode caps at 15 the same way as the normal mode', () => {
  const result = totalFromScores([5, 5, 5, NaN], { aplMode: true });
  assert.equal(result.sum, 15);
  assert.equal(result.computed, 15);
});