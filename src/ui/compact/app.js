import data from '../../core/data/annex-ii.json' with { type: 'json' };
import { ageBandIndex, calculateScore, minimumMarkForPoints, normalizeAgilityTenths } from '../../core/calculator.js';
import { formatAgility, formatDuration } from '../../core/formatters.js';
import { durationFromParts, durationToParts } from '../../core/time-inputs.js';
import { loadState, saveState } from '../../core/storage.js';

import { officialMarkBounds } from '../../core/reference-options.js';

const $ = selector => document.querySelector(selector);
const tests = data.tests;
const officialBounds = Object.fromEntries(Object.entries(tests).map(([key, test]) => [key, officialMarkBounds(test)]));

const ageBands = ['17–25 años', '26–30 años', '31–35 años', '36–40 años', '41–45 años', '46–50 años', '51–55 años', '56–59 años', '60 o más'];
let mode = 'mine';
let savedMarks = null;
let simulated = false;
let latestReport = { complete: false, status: 'PENDIENTE', average: null, results: {} };
const storage = availableStorage();

function availableStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const controls = {
  flex: {
    fields: [$('#flex')],
    read: () => $('#flex').value === '' ? null : Number($('#flex').value),
    write: mark => { $('#flex').value = mark ?? ''; },
    state: () => $('#flex').value,
    restore: value => { $('#flex').value = value ?? ''; },
    hasAny: () => $('#flex').value !== '',
  },
  plank: durationControl('plank'),
  run: durationControl('run'),
  agility: {
    fields: [$('#agility')],
    read: () => $('#agility').value === '' ? null : Number($('#agility').value),
    write: mark => { $('#agility').value = mark === null || mark === undefined ? '' : (mark / 10).toFixed(1); },
    state: () => $('#agility').value,
    restore: value => { $('#agility').value = value ?? ''; },
    hasAny: () => $('#agility').value !== '',
  },
};

function durationControl(key) {
  const minutes = $(`#${key}-minutes`);
  const seconds = $(`#${key}-seconds`);
  return {
    fields: [minutes, seconds],
    read: () => durationFromParts(minutes.value, seconds.value, { maxSeconds: officialBounds[key].max }),
    write: mark => {
      const parts = durationToParts(mark);
      minutes.value = parts.minutes;
      seconds.value = parts.seconds;
    },
    state: () => ({ minutes: minutes.value, seconds: seconds.value }),
    restore: value => {
      minutes.value = value?.minutes ?? '';
      seconds.value = value?.seconds ?? '';
    },
    hasAny: () => minutes.value !== '' || seconds.value !== '',
    isIncomplete: () => (minutes.value === '') !== (seconds.value === ''),
  };
}

const ageSelect = $('#age');
for (let age = 17; age <= 59; age += 1) {
  const option = document.createElement('option');
  option.value = String(age);
  option.textContent = String(age);
  ageSelect.append(option);
}
const age60Plus = document.createElement('option');
age60Plus.value = '60';
age60Plus.textContent = '60 o más';
ageSelect.append(age60Plus);
ageSelect.value = '30';
applyOfficialInputLimits();
restoreSavedState();

function applyOfficialInputLimits() {
  Object.entries(officialBounds).forEach(([key, bounds]) => {
    $(`#${key}-max`).textContent = displayMark(key, bounds.max);
  });
  $('#flex').max = String(officialBounds.flex.max);
  $('#agility').max = String(officialBounds.agility.max / 10);
  ['plank', 'run'].forEach(key => {
    $(`#${key}-minutes`).max = String(Math.floor(officialBounds[key].max / 60));
  });
}

function profile() {
  const age = Number(ageSelect.value);
  return { age: Number.isFinite(age) ? age : 17, sex: $('#sex').value };
}

function marksState() {
  return Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.state()]));
}

function restoreMarks(marks) {
  Object.entries(controls).forEach(([key, control]) => control.restore(marks?.[key]));
}

function persistState() {
  if (mode !== 'mine') return;
  const { sex, age } = profile();
  saveState(storage, { sex, age: String(age), marks: marksState() });
}

function restoreSavedState() {
  const state = loadState(storage);
  if (!state) return;
  $('#sex').value = state.sex;
  ageSelect.value = state.age;
  restoreMarks(state.marks);
}

function rawValue(key) {
  const value = controls[key].read();
  if (value === null || !Number.isFinite(value)) return null;
  const comparable = key === 'agility' ? normalizeAgilityTenths(value) : value;
  return comparable > officialBounds[key].max ? null : value;
}

function displayMark(key, mark) {
  if (mark === null || mark === undefined) return '—';
  if (key === 'plank' || key === 'run') return formatDuration(mark);
  if (key === 'agility') return formatAgility(mark);
  return `${mark} rep.`;
}

function targetFor(key) {
  const { age, sex } = profile();
  return minimumMarkForPoints(tests[key], { age, sex, points: 20 });
}

function differenceCopy(key, value, target) {
  if (value === null || target === null) return 'Sin marca';
  const higher = tests[key].direction === 'higher';
  const delta = higher ? value - target : target - value;
  const amount = key === 'agility' ? formatAgility(Math.abs(delta)) : key === 'flex' ? `${Math.abs(delta)} rep.` : formatDuration(Math.abs(delta));
  if (delta > 0) return `Margen: ${amount}`;
  if (delta === 0) return 'En el corte';
  return `Faltan: ${amount}`;
}

function updateMetric(key) {
  const { age, sex } = profile();
  const test = tests[key];
  const target = targetFor(key);
  const article = document.querySelector(`[data-test="${key}"]`);
  const targetElement = $(`#${key}-target`);
  const resultElement = $(`#${key}-result`);
  const value = rawValue(key);
  const normalized = key === 'agility' && value !== null ? normalizeAgilityTenths(value) : value;
  const score = calculateScore(test, { age, sex, value: normalized });
  targetElement.textContent = displayMark(key, target);
  article.classList.toggle('is-not-applicable', score === null);
  controls[key].fields.forEach(field => { field.disabled = score === null; });

  if (score === null) {
    targetElement.textContent = 'No aplicable';
    resultElement.className = 'result';
    resultElement.textContent = 'No corresponde';
    return { applicable: false, value: null, score: null, passed: true };
  }
  if (value === null || !Number.isFinite(value)) {
    resultElement.className = 'result';
    const control = controls[key];
    resultElement.textContent = !control.hasAny() ? (key === 'plank' || key === 'run' ? 'Completa min. y seg.' : 'Sin marca')
      : control.isIncomplete?.() ? 'Completa min. y seg.'
        : 'Fuera del máximo oficial';
    return { applicable: true, value: null, score: null, passed: false };
  }
  const passed = score >= 20;
  resultElement.className = `result ${passed ? 'pass' : 'fail'}`;
  resultElement.innerHTML = `<b>${score} pts</b>${differenceCopy(key, normalized, target)}`;
  return { applicable: true, value: normalized, score, passed };
}

function updateReport(results) {
  const applicable = Object.values(results).filter(item => item.applicable);
  const complete = applicable.length > 0 && applicable.every(item => item.score !== null);
  const status = $('#report-status');

  if (!complete) {
    status.className = 'report-status waiting';
    $('#status-word').textContent = mode === 'cut' ? 'CORTE' : 'PENDIENTE';
    $('#informe-title').textContent = mode === 'cut' ? 'Estas viendo tu corte de aptitud.' : 'Completa las marcas para obtener el resultado.';
    $('#report-detail').textContent = mode === 'cut' ? 'El corte general equivale a 20 puntos en cada prueba aplicable. Puedes usarlo como simulación o compararlo con tus marcas.' : 'La calificación de referencia exige al menos 20 puntos en cada prueba aplicable. La media no compensa una prueba inferior al corte.';
    $('#average').textContent = '—';
    $('#passed-count').textContent = '—';

    return { complete: false, status: 'PENDIENTE', average: null, results };
  }
  const scores = applicable.map(item => item.score);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const passedCount = applicable.filter(item => item.passed).length;
  const apto = passedCount === applicable.length;
  const reportStatus = apto ? 'APTO' : 'NO APTO';
  status.className = `report-status ${apto ? 'apto' : 'no-apto'}`;
  $('#status-word').textContent = reportStatus;
  $('#informe-title').textContent = apto ? 'Superas el corte en todas las pruebas.' : 'Hay al menos una prueba por debajo del corte.';
  $('#report-detail').textContent = apto ? 'Buen trabajo: mantienes como mínimo 20 puntos en cada prueba aplicable.' : 'La media es informativa. Para ser apto debes alcanzar al menos 20 puntos en todas las pruebas aplicables.';
  const averageText = average.toFixed(1).replace('.', ',');
  $('#average').textContent = averageText;
  $('#passed-count').textContent = `${passedCount}/${applicable.length}`;
  return { complete: true, status: reportStatus, average: averageText, results };
}

function updateProfileSummary() {
  const { age, sex } = profile();
  const sexLabel = sex === 'F' ? 'Mujer' : 'Hombre';
  const band = ageBands[ageBandIndex(age)] ?? 'tramo no disponible';
  $('#profile-summary').textContent = `${sexLabel} · ${age} años · tramo ${band}`;
}

function render() {
  updateProfileSummary();
  const results = Object.fromEntries(Object.keys(tests).map(key => [key, updateMetric(key)]));
  $('#agility-note').hidden = results.agility.applicable;
  latestReport = updateReport(results);
}

function applyCut() {
  Object.keys(controls).forEach(key => controls[key].write(targetFor(key)));
}

function updateModeControls() {
  document.querySelectorAll('.mode').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setMode(nextMode) {
  if (nextMode === mode) return;
  if (nextMode === 'cut') {
    savedMarks = marksState();
    simulated = true;
    mode = 'cut';
    applyCut();
  } else {
    mode = 'mine';
    if (simulated && savedMarks) restoreMarks(savedMarks);
    simulated = false;
    persistState();
  }
  updateModeControls();
  render();
}

function leaveCutAfterEdit(editedField) {
  const editedValue = editedField.value;
  mode = 'mine';
  if (savedMarks) restoreMarks(savedMarks);
  editedField.value = editedValue;
  simulated = false;
  updateModeControls();
}


function openBaremo(key) {
  const { age, sex } = profile();
  const test = tests[key];
  const column = test.sexes[0] === 'all' ? ageBandIndex(age) : ageBandIndex(age) * 2 + (sex === 'F' ? 1 : 0);
  if (test.ageBands && ageBandIndex(age) >= test.ageBands.length) return;
  $('#dialog-title').textContent = test.label;
  $('#dialog-subtitle').textContent = `${sex === 'F' ? 'Mujer' : 'Hombre'} · ${ageBands[ageBandIndex(age)]} · datos oficiales del Anexo II`;
  const target = targetFor(key);
  $('#baremo-body').innerHTML = test.rows.map(row => `<tr class="${row.mark === target ? 'highlight' : ''}"><td>${displayMark(key, row.mark)}</td><td>${row.scores[column]}</td></tr>`).join('');
  $('#baremo-dialog').showModal();
}


Object.entries(controls).forEach(([, control]) => control.fields.forEach(field => field.addEventListener('input', () => {
  if (mode === 'cut') leaveCutAfterEdit(field);
  persistState();
  render();
})));

$('#sex').addEventListener('change', () => { if (simulated) applyCut(); else persistState(); render(); });
$('#age').addEventListener('change', () => { if (simulated) applyCut(); else persistState(); render(); });
document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('.baremo-button').forEach(button => button.addEventListener('click', () => openBaremo(button.dataset.baremo)));
$('.profile-edit').addEventListener('click', () => {
  const details = $('#profile-details');
  details.hidden = !details.hidden;
  $('.profile-edit').setAttribute('aria-expanded', String(!details.hidden));
  if (!details.hidden) details.querySelector('select').focus();
});
$('#close-dialog').addEventListener('click', () => $('#baremo-dialog').close());
$('#baremo-dialog').addEventListener('click', event => { if (event.target === $('#baremo-dialog')) $('#baremo-dialog').close(); });


render();
