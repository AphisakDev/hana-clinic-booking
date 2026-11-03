/**
 * The clinic runs on Bangkok time (UTC+7, no daylight saving), so a fixed
 * offset is enough. Dates travel as "YYYY-MM-DD" and times as "HH:mm".
 */
const OFFSET_MS = 7 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

export function isValidTimeString(value: string): boolean {
  return TIME_RE.test(value);
}

/** Absolute instant for a Bangkok wall-clock date + time. */
export function bangkokDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+07:00`);
}

/** "YYYY-MM-DD" of the instant as seen in Bangkok. */
export function toBangkokDate(instant: Date): string {
  return new Date(instant.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** "HH:mm" of the instant as seen in Bangkok. */
export function toBangkokTime(instant: Date): string {
  return new Date(instant.getTime() + OFFSET_MS).toISOString().slice(11, 16);
}

/** Minutes since midnight for "HH:mm". */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Whole days from `from` to `to`, both "YYYY-MM-DD". */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}
