import { buildMonthGrid, shiftMonth } from './calendar';

describe('buildMonthGrid', () => {
  // November 2026 starts on a Sunday, so the Monday-first grid begins on 26 Oct.
  const grid = buildMonthGrid(2026, 11, '2026-11-10', '2026-12-05');

  it('always contains whole Monday-first weeks', () => {
    expect(grid.length % 7).toBe(0);
    expect(grid[0].iso).toBe('2026-10-26');
    expect(grid.at(-1)!.iso).toBe('2026-12-06');
  });

  it('marks days outside the month', () => {
    expect(grid[0].inMonth).toBe(false);
    expect(grid.find((d) => d.iso === '2026-11-01')!.inMonth).toBe(true);
  });

  it('only lets the user pick days between min and max (inclusive)', () => {
    const selectable = grid.filter((d) => d.selectable).map((d) => d.iso);
    expect(selectable[0]).toBe('2026-11-10');
    expect(selectable.at(-1)).toBe('2026-12-05');
  });
});

describe('shiftMonth', () => {
  it('wraps around the year', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2027, 1, -1)).toEqual({ year: 2026, month: 12 });
  });
});
