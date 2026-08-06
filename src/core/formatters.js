export function parseDuration(input) {
  const value = String(input).trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (seconds > 59) return null;
  return minutes * 60 + seconds;
}

export function formatDuration(totalSeconds) {
  const seconds = Math.round(Number(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatAgility(tenths) {
  return `${(Number(tenths) / 10).toFixed(1).replace('.', ',')} s`;
}
