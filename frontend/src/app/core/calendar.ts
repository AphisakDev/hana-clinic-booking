import { addDays, parseIsoDate } from './format';

export interface CalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
  selectable: boolean;
}

/**
 * Builds a Monday-first month grid (always whole weeks) and marks which days
 * can be booked: from `minDate` to `maxDate`, both inclusive.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  minDate: string,
  maxDate: string,
): CalendarDay[] {
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (firstWeekday + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const start = addDays(first, -offset);
  return Array.from({ length: cells }, (_, i) => {
    const iso = addDays(start, i);
    const parts = parseIsoDate(iso);
    return {
      iso,
      day: parts.day,
      inMonth: parts.month === month,
      selectable: iso >= minDate && iso <= maxDate,
    };
  });
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}
