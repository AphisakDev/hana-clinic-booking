import { bangkokDateTime } from '../common/bangkok-time.js';
import {
  overlaps,
  SlotCalculator,
  type SlotRequest,
} from './slot-calculator.js';

describe('SlotCalculator', () => {
  const calculator = new SlotCalculator();
  const base: SlotRequest = {
    date: '2026-11-18',
    openTime: '11:00',
    closeTime: '14:00',
    durationMin: 60,
    doctorIds: ['dr-a', 'dr-b'],
    busy: [],
    now: bangkokDateTime('2026-11-17', '09:00'),
  };

  it('creates a slot every 30 minutes that still finishes before closing', () => {
    const times = calculator.calculate(base).map((s) => s.time);
    expect(times).toEqual(['11:00', '11:30', '12:00', '12:30', '13:00']);
  });

  it('stores slot instants in Bangkok time (UTC+7)', () => {
    const [first] = calculator.calculate(base);
    expect(first.startAt.toISOString()).toBe('2026-11-18T04:00:00.000Z');
    expect(first.endAt.toISOString()).toBe('2026-11-18T05:00:00.000Z');
  });

  it('keeps a slot available while at least one doctor is free', () => {
    const slots = calculator.calculate({
      ...base,
      busy: [
        {
          doctorId: 'dr-a',
          startAt: bangkokDateTime('2026-11-18', '11:00'),
          endAt: bangkokDateTime('2026-11-18', '12:00'),
        },
      ],
    });
    expect(slots[0]).toMatchObject({
      time: '11:00',
      available: true,
      availableDoctorIds: ['dr-b'],
    });
  });

  it('blocks every slot that overlaps a booking when all doctors are busy', () => {
    const busy = ['dr-a', 'dr-b'].map((doctorId) => ({
      doctorId,
      startAt: bangkokDateTime('2026-11-18', '12:00'),
      endAt: bangkokDateTime('2026-11-18', '13:00'),
    }));
    const available = calculator
      .calculate({ ...base, busy })
      .filter((s) => s.available)
      .map((s) => s.time);
    // 11:30 would end at 12:30 and 12:30 would start inside the booking.
    expect(available).toEqual(['11:00', '13:00']);
  });

  it('treats a booking that ends exactly at slot start as no conflict', () => {
    const slots = calculator.calculate({
      ...base,
      doctorIds: ['dr-a'],
      busy: [
        {
          doctorId: 'dr-a',
          startAt: bangkokDateTime('2026-11-18', '10:00'),
          endAt: bangkokDateTime('2026-11-18', '11:00'),
        },
      ],
    });
    expect(slots[0].available).toBe(true);
  });

  it('hides slots that start within the 60-minute lead time', () => {
    const slots = calculator.calculate({
      ...base,
      now: bangkokDateTime('2026-11-18', '11:15'),
    });
    const available = slots.filter((s) => s.available).map((s) => s.time);
    expect(available).toEqual(['12:30', '13:00']);
  });

  it('returns no slots when the treatment is longer than opening hours', () => {
    expect(calculator.calculate({ ...base, durationMin: 240 })).toEqual([]);
  });
});

describe('overlaps', () => {
  const at = (time: string) => bangkokDateTime('2026-11-18', time);

  it.each([
    ['10:00', '11:00', '10:30', '11:30', true],
    ['10:00', '11:00', '11:00', '12:00', false],
    ['10:00', '12:00', '10:30', '11:00', true],
    ['10:00', '10:30', '11:00', '11:30', false],
  ])('%s-%s vs %s-%s -> %s', (aStart, aEnd, bStart, bEnd, expected) => {
    expect(
      overlaps(
        { startAt: at(aStart), endAt: at(aEnd) },
        { startAt: at(bStart), endAt: at(bEnd) },
      ),
    ).toBe(expected);
  });
});
