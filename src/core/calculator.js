const AGE_BANDS = [25, 30, 35, 40, 45, 50, 55, 59, Infinity];

export function ageBandIndex(age) {
  const numericAge = Number(age);
  if (!Number.isFinite(numericAge) || numericAge < 17) throw new RangeError('La edad debe ser igual o superior a 17 años.');
  return AGE_BANDS.findIndex(limit => numericAge <= limit);
}

function scoreColumn(test, age, sex) {
  const band = ageBandIndex(age);
  const availableBands = test.ageBands?.length ?? 9;
  if (band >= availableBands) return null;
  if (test.sexes[0] === 'all') return band;
  return band * 2 + (sex === 'F' ? 1 : 0);
}

export function normalizeAgilityTenths(seconds) {
  return Math.floor(Number(seconds) * 10 + 1e-9);
}

export function calculateScore(test, { age, sex = 'M', value }) {
  const column = scoreColumn(test, age, sex);
  if (column === null) return null;
  const mark = Number(value);
  if (!Number.isFinite(mark)) return null;
  const row = test.direction === 'higher'
    ? test.rows.find(candidate => mark >= candidate.mark)
    : test.rows.find(candidate => mark <= candidate.mark);
  return row ? row.scores[column] : 0;
}

export function minimumMarkForPoints(test, { age, sex = 'M', points = 20 }) {
  const column = scoreColumn(test, age, sex);
  if (column === null) return null;
  const candidates = test.rows.filter(row => row.scores[column] >= points);
  if (candidates.length === 0) return null;
  return test.direction === 'higher' ? candidates.at(-1).mark : candidates.at(-1).mark;
}

export function evaluate({ age, sex = 'M', values }, tests) {
  const resultTests = {};
  for (const [key, test] of Object.entries(tests)) {
    const rawValue = values[key];
    const value = key === 'agility' ? normalizeAgilityTenths(rawValue) : Number(rawValue);
    const score = calculateScore(test, { age, sex, value });
    resultTests[key] = {
      applicable: score !== null,
      value,
      score,
      target: minimumMarkForPoints(test, { age, sex, points: 20 }),
      passed: score === null || score >= 20,
    };
  }
  const applicable = Object.values(resultTests).filter(item => item.applicable);
  const average = applicable.reduce((total, item) => total + item.score, 0) / applicable.length;
  const status = applicable.every(item => item.passed) ? 'APTO' : 'NO APTO';
  return { tests: resultTests, average, status };
}
