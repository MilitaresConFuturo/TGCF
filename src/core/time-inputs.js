export function durationFromParts(minutesInput, secondsInput, { maxSeconds = 5999 } = {}) {
  const minutesText = String(minutesInput ?? '').trim();
  const secondsText = String(secondsInput ?? '').trim();
  if (!minutesText && !secondsText) return null;
  if (!/^\d+$/.test(minutesText) || !/^\d+$/.test(secondsText)) return null;
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  if (minutes > 99 || seconds > 59) return null;
  const totalSeconds = minutes * 60 + seconds;
  return totalSeconds <= maxSeconds ? totalSeconds : null;
}

export function durationToParts(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(Number(totalSeconds))) {
    return { minutes: '', seconds: '' };
  }
  const value = Math.round(Number(totalSeconds));
  if (value < 0) return { minutes: '', seconds: '' };
  return {
    minutes: String(Math.floor(value / 60)),
    seconds: String(value % 60).padStart(2, '0'),
  };
}
