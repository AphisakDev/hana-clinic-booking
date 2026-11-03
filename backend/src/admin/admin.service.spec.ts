import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingService } from '../booking/booking.service.js';
import { InMemoryBookingRepository } from '../booking/in-memory-booking.repository.js';
import { InMemoryTimeBlockRepository } from '../booking/in-memory-time-block.repository.js';
import { SlotCalculator } from '../booking/slot-calculator.js';
import type { CreateBookingDto } from '../booking/dto/create-booking.dto.js';
import { InMemoryCatalogRepository } from '../catalog/in-memory-catalog.repository.js';
import { bangkokDateTime } from '../common/bangkok-time.js';
import { FixedClock } from '../common/clock.js';
import { AdminService } from './admin.service.js';

describe('AdminService', () => {
  let clock: FixedClock;
  let admin: AdminService;
  let booking: BookingService;

  const book = (overrides: Partial<CreateBookingDto> = {}) =>
    booking.create({
      treatmentSlug: 'hydrafacial', // ฿1,990, 60 min
      branchSlug: 'siam',
      date: '2026-11-18',
      time: '11:00',
      customerName: 'มายด์ ศิริพร',
      phone: '0891231840',
      email: 'mind@example.com',
      ...overrides,
    } as CreateBookingDto);

  beforeEach(() => {
    const bookings = new InMemoryBookingRepository();
    const blocks = new InMemoryTimeBlockRepository();
    const catalog = new InMemoryCatalogRepository();
    clock = new FixedClock(bangkokDateTime('2026-11-10', '09:00'));
    booking = new BookingService(
      bookings,
      catalog,
      new SlotCalculator(),
      clock,
      blocks,
    );
    admin = new AdminService(bookings, blocks, catalog, clock);
  });

  describe('getSchedule', () => {
    it('groups the day by doctor with full contact details', async () => {
      const a = await book({ doctorSlug: 'napatsorn', time: '14:00' });
      await book({ doctorSlug: 'napatsorn', time: '11:00' });
      await book({ date: '2026-11-19' }); // another day: not included

      const schedule = await admin.getSchedule('2026-11-18', 'siam');
      const napatsorn = schedule.doctors.find((d) => d.slug === 'napatsorn')!;

      expect(napatsorn.bookings.map((b) => b.startTime)).toEqual([
        '11:00',
        '14:00',
      ]);
      expect(napatsorn.bookings[1]).toMatchObject({
        reference: a.reference,
        phone: '0891231840', // not masked for staff
        nextStatuses: ['CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
      });
      expect(schedule.summary).toMatchObject({
        total: 2,
        expectedRevenueThb: 3980,
      });
    });

    it('404s for an unknown branch', async () => {
      await expect(
        admin.getSchedule('2026-11-18', 'nope'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('moves a booking through check-in to completed', async () => {
      const { reference } = await book();
      await admin.changeStatus(reference, 'CHECKED_IN');
      const done = await admin.changeStatus(reference, 'COMPLETED');
      expect(done.status).toBe('COMPLETED');
      expect(done.nextStatuses).toEqual([]);
    });

    it('rejects transitions the rules do not allow', async () => {
      const { reference } = await book();
      await expect(
        admin.changeStatus(reference, 'COMPLETED'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('frees the slot when staff cancel', async () => {
      const first = await book({ doctorSlug: 'napatsorn' });
      await admin.changeStatus(first.reference, 'CANCELLED');
      const again = await book({ doctorSlug: 'napatsorn' });
      expect(again.startTime).toBe('11:00');
    });
  });

  describe('time blocks', () => {
    const block = (startTime: string, endTime: string) =>
      admin.createBlock({
        doctorSlug: 'napatsorn',
        date: '2026-11-18',
        startTime,
        endTime,
        reason: 'ประชุม',
      });

    it('removes the blocked time from what clients can book', async () => {
      await block('11:00', '20:00');
      const view = await book({ time: '11:00' }); // "any doctor"
      expect(view.doctor.slug).toBe('thanakorn');
      await expect(
        book({ doctorSlug: 'napatsorn', time: '15:00' }),
      ).rejects.toThrow();
    });

    it('refuses to block over an existing appointment', async () => {
      await book({ doctorSlug: 'napatsorn', time: '12:00' });
      await expect(block('11:30', '12:30')).rejects.toThrow(
        'มีนัดของคนไข้ 1 รายการ',
      );
    });

    it('refuses overlapping blocks and invalid ranges', async () => {
      await block('13:00', '14:00');
      await expect(block('13:30', '15:00')).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(block('15:00', '14:00')).rejects.toThrow(
        'เวลาเริ่มต้องก่อนเวลาสิ้นสุด',
      );
    });

    it('can be deleted, which makes the time bookable again', async () => {
      const b = await block('11:00', '12:00');
      await admin.deleteBlock(b.id);
      const view = await book({ doctorSlug: 'napatsorn', time: '11:00' });
      expect(view.startTime).toBe('11:00');
    });
  });

  describe('getStats', () => {
    it('counts today, the next 7 days and the no-show rate', async () => {
      await book({ date: '2026-11-10', time: '13:00' });
      await book({
        date: '2026-11-10',
        time: '15:00',
        treatmentSlug: 'laser-hair-removal',
      });
      const late = await book({ date: '2026-11-12', time: '11:00' });
      const missed = await book({ date: '2026-11-11', time: '11:00' });
      await admin.changeStatus(missed.reference, 'NO_SHOW');

      clock.set(bangkokDateTime('2026-11-12', '09:00'));
      await admin.changeStatus(late.reference, 'CANCELLED');
      const stats = await admin.getStats('siam');

      expect(stats.today).toBe('2026-11-12');
      expect(stats.todayBookings).toBe(0); // the only one today was cancelled
      // Past appointments: 2 on the 10th + 1 no-show on the 11th → 1/3
      expect(stats.noShowRate30d).toBeCloseTo(0.333, 3);
      expect(stats.topTreatments30d[0]).toMatchObject({
        slug: 'hydrafacial',
        count: 2,
      });
      expect(stats.daily).toHaveLength(7);
    });
  });
});
