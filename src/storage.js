import data from './data/annex-ii.json' with { type: 'json' };
import { officialMarkBounds } from './reference-options.js';

export const STORAGE_KEY = 'tgcf-evaluacion-fisica-v1';
const bounds = Object.fromEntries(Object.entries(data.tests).map(([key, test]) => [key, officialMarkBounds(test)]));

function normalizeState(value) {
  if (!value || typeof value !== 'object') return null;
  const sex = value.sex === 'F' ? 'F' : value.sex === 'M' ? 'M' : null;
  const age = String(value.age ?? '');
  const numericAge = Number(age);
  const marks = value.marks;
  if (!sex || !Number.isInteger(numericAge) || numericAge < 17 || numericAge > 60 || !marks || typeof marks !== 'object') return null;
  const text = field => typeof field === 'string' ? field : '';
  const numericMark = (field, max) => /^\d+(?:\.\d+)?$/.test(text(field)) && Number(field) <= max ? text(field) : '';
  const duration = (value, max) => {
    const part = (field, limit) => /^\d+$/.test(text(field)) && Number(field) <= limit ? text(field) : '';
    const minutes = part(value?.minutes, 99);
    const seconds = part(value?.seconds, 59);
    if (minutes && seconds && Number(minutes) * 60 + Number(seconds) > max) return { minutes: '', seconds: '' };
    return { minutes, seconds };
  };
  const plank = marks.plank && typeof marks.plank === 'object' ? marks.plank : {};
  const run = marks.run && typeof marks.run === 'object' ? marks.run : {};
  return {
    sex,
    age,
    marks: {
      flex: numericMark(marks.flex, bounds.flex.max),
      plank: duration(plank, bounds.plank.max),
      run: duration(run, bounds.run.max),
      agility: numericMark(marks.agility, bounds.agility.max / 10),
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
