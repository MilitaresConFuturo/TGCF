export const STORAGE_KEY = 'permanencia-2026-evaluacion-fisica-v1';

function normalizeState(value) {
  if (!value || typeof value !== 'object') return null;
  const sex = value.sex === 'F' ? 'F' : value.sex === 'M' ? 'M' : null;
  const marks = value.marks;
  if (!sex || !marks || typeof marks !== 'object') return null;
  const text = field => typeof field === 'string' ? field : '';
  const numericMark = field => /^\d+(?:\.\d+)?$/.test(text(field)) ? text(field) : '';
  const duration = value => {
    const part = field => /^\d+$/.test(text(field)) ? text(field) : '';
    return { minutes: part(value?.minutes), seconds: part(value?.seconds) };
  };
  const plank = marks.plank && typeof marks.plank === 'object' ? marks.plank : {};
  const run = marks.run && typeof marks.run === 'object' ? marks.run : {};
  return {
    sex,
    marks: {
      flex: numericMark(marks.flex),
      plank: duration(plank),
      run: duration(run),
      agility: numericMark(marks.agility),
    },
  };
}

export function loadState(storage) {
  try {
    return normalizeState(JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return null;
  }
}

export function saveState(storage, state) {
  const normalized = normalizeState(state);
  if (!storage || !normalized) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}
