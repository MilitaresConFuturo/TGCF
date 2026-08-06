export function officialReferenceMarks(test) {
  return [...new Set(test.rows.map(row => row.mark))].sort((left, right) => left - right);
}

export function officialMarkBounds(test) {
  const marks = officialReferenceMarks(test);
  return { min: marks[0], max: marks.at(-1) };
}
