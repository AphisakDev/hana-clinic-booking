const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];
const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];
const THAI_WEEKDAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

/** 1990 → "฿1,990" (0 → "฿0") */
export function formatBaht(thb: number): string {
  return `฿${thb.toLocaleString('en-US')}`;
}

/** Price shown to clients: free items read "ฟรี". */
export function formatPrice(thb: number): string {
  return thb === 0 ? 'ฟรี' : formatBaht(thb);
}

/** Parses "YYYY-MM-DD" as a calendar date (no time zone shifts). */
export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

export function weekdayOf(iso: string): number {
  const { year, month, day } = parseIsoDate(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** "2026-11-18" → "วันพุธที่ 18 พฤศจิกายน 2569" (Buddhist year) */
export function formatThaiDate(
  iso: string,
  opts: { weekday?: boolean; short?: boolean } = {},
): string {
  const { year, month, day } = parseIsoDate(iso);
  const monthName = (opts.short ? THAI_MONTHS_SHORT : THAI_MONTHS)[month - 1];
  const date = `${day} ${monthName} ${year + 543}`;
  return opts.weekday ? `วัน${THAI_WEEKDAYS[weekdayOf(iso)]}ที่ ${date}` : date;
}

/** Month header for the calendar, e.g. "พฤศจิกายน 2569" */
export function formatThaiMonth(year: number, month: number): string {
  return `${THAI_MONTHS[month - 1]} ${year + 543}`;
}

/** An ISO instant shown in Bangkok time, e.g. "17 พ.ย. 2569 · 10:30 น." */
export function formatBangkokDateTime(isoInstant: string): string {
  const shifted = new Date(new Date(isoInstant).getTime() + 7 * 60 * 60 * 1000);
  const date = shifted.toISOString().slice(0, 10);
  const time = shifted.toISOString().slice(11, 16);
  return `${formatThaiDate(date, { short: true })} · ${time} น.`;
}

/** Today's date in Asia/Bangkok as "YYYY-MM-DD". */
export function todayInBangkok(now: Date = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const { year, month, day } = parseIsoDate(iso);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
