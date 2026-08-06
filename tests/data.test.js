import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/data/annex-ii.json' with { type: 'json' };

test('Anexo II has the expected official table boundaries', () => {
  const { flex, plank, run, agility } = data.tests;
  assert.equal(flex.rows.length, 74);
  assert.equal(plank.rows.length, 84);
  assert.equal(plank.rows[0].mark, 315);
  assert.equal(plank.rows.at(-1).mark, 15);
  assert.equal(run.rows[0].mark, 386);
  assert.equal(agility.rows.length, 75);
  assert.equal(agility.rows[0].mark, 116);
  assert.equal(agility.rows.at(-1).mark, 190);
});

test('source tables contain scores for every published sex/age column', () => {
  assert.ok(data.tests.flex.rows.every(row => row.scores.length === 18));
  assert.ok(data.tests.plank.rows.every(row => row.scores.length === 9));
  assert.ok(data.tests.run.rows.every(row => row.scores.length === 18));
  assert.ok(data.tests.agility.rows.every(row => row.scores.length === 10));
});
