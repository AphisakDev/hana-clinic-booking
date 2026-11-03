import {
  addDays,
  formatBangkokDateTime,
  formatPrice,
  formatThaiDate,
  todayInBangkok,
} from './format';

describe('format helpers', () => {
  it('formats prices in baht and shows free items as ฟรี', () => {
    expect(formatPrice(1990)).toBe('฿1,990');
    expect(formatPrice(12500)).toBe('฿12,500');
    expect(formatPrice(0)).toBe('ฟรี');
  });

  it('formats dates in Thai with the Buddhist year', () => {
    expect(formatThaiDate('2026-11-18')).toBe('18 พฤศจิกายน 2569');
    expect(formatThaiDate('2026-11-18', { weekday: true })).toBe('วันพุธที่ 18 พฤศจิกายน 2569');
    expect(formatThaiDate('2027-01-02', { short: true })).toBe('2 ม.ค. 2570');
  });

  it('shows UTC instants in Bangkok time', () => {
    // 03:30 UTC = 10:30 in Bangkok
    expect(formatBangkokDateTime('2026-11-17T03:30:00.000Z')).toBe('17 พ.ย. 2569 · 10:30 น.');
  });

  it('uses the Bangkok date even when UTC is still on the previous day', () => {
    expect(todayInBangkok(new Date('2026-11-17T18:00:00Z'))).toBe('2026-11-18');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
