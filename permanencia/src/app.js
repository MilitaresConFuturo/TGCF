import data from './data/anexo-iii.json' with { type: 'json' };
import { calculateScore, rangeLabelFor, totalFromScores } from './calculator.js';
import { formatAgility, formatDuration } from './formatters.js';
import { durationFromParts, durationToParts } from './time-inputs.js';
import { loadState, saveState } from './storage.js';

const $ = selector => document.querySelector(selector);
const tests = data.tests;
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
    state: () => $('#flex').value,
    restore: value => { $('#flex').value = value ?? ''; },
    hasAny: () => $('#flex').value !== '',
  },
  plank: durationControl('plank'),
  run: durationControl('run'),
  agility: {
    fields: [$('#agility')],
    read: () => $('#agility').value === '' ? null : Math.round(Number($('#agility').value) * 10),
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
    read: () => durationFromParts(minutes.value, seconds.value, { maxSeconds: 5999 }),
    state: () => ({ minutes: minutes.value, seconds: seconds.value }),
    restore: value => {
      minutes.value = value?.minutes ?? '';
      seconds.value = value?.seconds ?? '';
    },
    hasAny: () => minutes.value !== '' || seconds.value !== '',
    isIncomplete: () => (minutes.value === '') !== (seconds.value === ''),
  };
}

restoreSavedState();

function sex() {
  return $('#sex').value;
}

function marksState() {
  return Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.state()]));
}

function restoreMarks(marks) {
  Object.entries(controls).forEach(([key, control]) => control.restore(marks?.[key]));
}

function persistState() {
  saveState(storage, { sex: sex(), marks: marksState() });
}

function restoreSavedState() {
  const state = loadState(storage);
  if (!state) return;
  $('#sex').value = state.sex;
  restoreMarks(state.marks);
}

function displayMark(key, value) {
  if (value === null || value === undefined) return '—';
  if (key === 'plank') return formatDuration(value);
  if (key === 'run') return formatDuration(value);
  if (key === 'agility') return formatAgility(value);
  return `${value} rep.`;
}

function updateMetric(key) {
  const control = controls[key];
  const value = control.read();
  const article = document.querySelector(`[data-test="${key}"]`);
  const resultElement = $(`#${key}-result`);
  const score = calculateScore(tests[key], sex(), value);

  if (value === null) {
    resultElement.className = 'result';
    resultElement.textContent = !control.hasAny() ? 'Sin marca'
      : control.isIncomplete?.() ? 'Completa min. y seg.'
        : 'Marca no válida';
    return null;
  }
  const rangeLabel = rangeLabelFor(tests[key], sex(), value);
  resultElement.className = `result score-${score}`;
  resultElement.innerHTML = `<b>${score} pts</b>Tramo oficial: ${rangeLabel}`;
  return score;
}

function updateReport(scores) {
  const status = $('#report-status');
  const values = Object.values(scores);
  const hasAny = values.some(score => score !== null);
  const { sum, computed, complete } = totalFromScores(values.map(score => score ?? NaN));

  if (!complete) {
    status.className = 'report-status waiting';
    $('#status-word').textContent = 'PENDIENTE';
    $('#informe-title').textContent = hasAny ? 'Completa las 4 pruebas para ver el total.' : 'Introduce tus 4 marcas para calcular la puntuación.';
    $('#sum-raw').textContent = '—';
    $('#total-computed').textContent = '—';
    return;
  }
  status.className = 'report-status computed';
  $('#status-word').textContent = `${computed}/15`;
  $('#informe-title').textContent = sum > 15
    ? 'Suma bruta superior a 15: se aplica el tope oficial.'
    : 'Puntuación física para el concurso de permanencia.';
  $('#sum-raw').textContent = `${sum}/20`;
  $('#total-computed').textContent = `${computed}/15`;
}

function render() {
  const scores = Object.fromEntries(Object.keys(tests).map(key => [key, updateMetric(key)]));
  updateReport(scores);
}

Object.entries(controls).forEach(([, control]) => control.fields.forEach(field => field.addEventListener('input', () => {
  persistState();
  render();
})));

$('#sex').addEventListener('change', () => { persistState(); render(); });

document.querySelectorAll('.baremo-button').forEach(button => button.addEventListener('click', () => openBaremo(button.dataset.baremo)));
$('#close-dialog').addEventListener('click', () => $('#baremo-dialog').close());
$('#baremo-dialog').addEventListener('click', event => { if (event.target === $('#baremo-dialog')) $('#baremo-dialog').close(); });

function openBaremo(key) {
  const test = tests[key];
  const rows = test.bySex[sex() === 'F' ? 'F' : 'M'];
  $('#dialog-title').textContent = test.label;
  $('#dialog-subtitle').textContent = `${sex() === 'F' ? 'Mujer' : 'Hombre'} · Anexo III, apartado quinto`;
  $('#baremo-body').innerHTML = rows.map(row => `<tr><td>${row.rangeLabel}</td><td>${row.score}</td></tr>`).join('');
  $('#baremo-dialog').showModal();
}

render();
