export function calculateScore(test, sex, value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  const rows = test.bySex[sex === 'F' ? 'F' : 'M'];
  const numericValue = Number(value);
  const row = test.direction === 'higher'
    ? rows.find(candidate => numericValue >= candidate.mark)
    : rows.find(candidate => numericValue <= candidate.mark);
  return row ? row.score : 0;
}

export function rangeLabelFor(test, sex, value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  const rows = test.bySex[sex === 'F' ? 'F' : 'M'];
  const numericValue = Number(value);
  const row = test.direction === 'higher'
    ? rows.find(candidate => numericValue >= candidate.mark)
    : rows.find(candidate => numericValue <= candidate.mark);
  return row ? row.rangeLabel : null;
}

export function totalFromScores(scores) {
  const validScores = scores.filter(score => Number.isFinite(score));
  const sum = validScores.reduce((total, score) => total + score, 0);
  return { sum, computed: Math.min(sum, 15), complete: validScores.length === scores.length && scores.length > 0 };
}
