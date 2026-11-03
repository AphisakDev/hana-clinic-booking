import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InMemoryCatalogRepository } from '../catalog/in-memory-catalog.repository.js';
import { bangkokDateTime } from '../common/bangkok-time.js';
import { FixedClock } from '../common/clock.js';
import { BookingService, maskEmail, maskPhone } from './booking.service.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import { InMemoryBookingRepository } from './in-memory-booking.repository.js';
import { InMemoryTimeBlockRepository } from './in-memory-time-block.repository.js';
import { SlotCalculator } from './slot-calculator.js';

describe('BookingService', () => {
  let repo: InMemoryBookingRepository;
  let clock: FixedClock;
  let service: BookingService;
  let blocks: InMemoryTimeBlockRepository;

  // Samyan branch: 11:00-20:00, doctors napatsorn + thanakorn.
  const request = (overrides: Partial<CreateBookingDto> = {}) =>
    ({
      treatmentSlug: 'hydrafacial',
      branchSlug: 'siam',
      date: '2026-11-18',
      time: '11:00',
      customerName: 'มายด์ ศิริพร',
      phone: '0891231840',
      email: 'mind@example.com',
      ...overrides,
    }) as CreateBookingDto;

  beforeEach(() => {
    repo = new InMemoryBookingRepository();
    clock = new FixedClock(bangkokDateTime('2026-11-10', '09:00'));
    blocks = new InMemoryTimeBlockRepository();
    service = new BookingService(
      repo,
      new InMemoryCatalogRepository(),
      new SlotCalculator(),
      clock,
      blocks,
    );
  });

  describe('create', () => {
    it('books the slot and returns a readable reference', async () => {
      const view = await service.create(request());

      expect(view.reference).toMatch(/^HNA-691118-[2-9A-Z]{4}$/);
      expect(view).toMatchObject({
        status: 'CONFIRMED',
        date: '2026-11-18',
        startTime: '11:00',
        endTime: '12:00',
        treatment: { slug: 'hydrafacial', priceThb: 1990 },
        branch: { slug: 'siam' },
        canCancel: true,
      });
      expect(repo.bookings).toHaveLength(1);
    });

    it('assigns the next free doctor when "any doctor" is chosen', async () => {
      const first = await service.create(request());
      const second = await service.create(request());
      expect(first.doctor.slug).not.toBe(second.doctor.slug);
    });

    it('rejects a third booking when both doctors are already taken', async () => {
      await service.create(request());
      await service.create(request());
      await expect(service.create(request())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('never double-books a specific doctor', async () => {
      await service.create(request({ doctorSlug: 'napatsorn' }));
      await expect(
        service.create(request({ doctorSlug: 'napatsorn', time: '11:30' })),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a time outside the slot grid', async () => {
      await expect(
        service.create(request({ time: '11:15' })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects dates in the past or too far ahead', async () => {
      await expect(
        service.create(request({ date: '2026-11-09' })),
      ).rejects.toThrow('ไม่สามารถจองย้อนหลังได้');
      await expect(
        service.create(request({ date: '2027-01-20' })),
      ).rejects.toThrow('จองล่วงหน้าได้ไม่เกิน 60 วัน');
    });

    it('rejects a doctor from another branch', async () => {
      await expect(
        service.create(request({ doctorSlug: 'pimchanok' })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns 404 for an unknown treatment', async () => {
      await expect(
        service.create(request({ treatmentSlug: 'nope' })),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('masks personal details in the response', async () => {
      const view = await service.create(request());
      expect(view.phone).toBe('089-xxx-1840');
      expect(view.email).toBe('mi**@example.com');
    });
  });

  describe('getAvailability', () => {
    it('marks a slot unavailable once every doctor is booked', async () => {
      await service.create(request());
      await service.create(request());

      const { slots } = await service.getAvailability({
        treatmentSlug: 'hydrafacial',
        branchSlug: 'siam',
        date: '2026-11-18',
      });
      const byTime = Object.fromEntries(
        slots.map((s) => [s.time, s.available]),
      );
      expect(byTime['11:00']).toBe(false);
      expect(byTime['11:30']).toBe(false);
      expect(byTime['12:00']).toBe(true);
    });

    it('ignores cancelled bookings', async () => {
      const a = await service.create(request());
      await service.create(request());
      await service.cancel(a.reference);

      const { slots } = await service.getAvailability({
        treatmentSlug: 'hydrafacial',
        branchSlug: 'siam',
        date: '2026-11-18',
      });
      expect(slots.find((s) => s.time === '11:00')?.available).toBe(true);
    });
  });

  describe('cancel', () => {
    it('cancels when more than 24 hours remain', async () => {
      const { reference } = await service.create(request());
      const view = await service.cancel(reference.toLowerCase());
      expect(view.status).toBe('CANCELLED');
      expect(view.canCancel).toBe(false);
    });

    it('refuses within 24 hours of the appointment', async () => {
      const { reference } = await service.create(request());
      clock.set(bangkokDateTime('2026-11-17', '11:01'));
      await expect(service.cancel(reference)).rejects.toThrow(
        'ยกเลิกออนไลน์ได้ก่อนเวลานัด 24 ชม.',
      );
    });

    it('refuses to cancel twice', async () => {
      const { reference } = await service.create(request());
      await service.cancel(reference);
      await expect(service.cancel(reference)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('doctor time blocks', () => {
    const blockDoctor = (doctorId: string, from: string, to: string) =>
      blocks.create({
        doctorId,
        startAt: bangkokDateTime('2026-11-18', from),
        endAt: bangkokDateTime('2026-11-18', to),
        reason: 'ลา',
      });

    it('hides a slot when every doctor at the branch is blocked', async () => {
      await blockDoctor('doctor-napatsorn', '11:00', '13:00');
      await blockDoctor('doctor-thanakorn', '11:00', '12:00');

      const { slots } = await service.getAvailability({
        treatmentSlug: 'hydrafacial',
        branchSlug: 'siam',
        date: '2026-11-18',
      });
      const at = (time: string) => slots.find((s) => s.time === time)!;
      expect(at('11:00').available).toBe(false);
      expect(at('11:30').available).toBe(false); // would run into 12:00 for thanakorn
      expect(at('12:00').available).toBe(true); // thanakorn is free again
    });

    it('never books a blocked doctor', async () => {
      await blockDoctor('doctor-napatsorn', '11:00', '12:00');
      const view = await service.create(request({ time: '11:00' }));
      expect(view.doctor.slug).toBe('thanakorn');
    });
  });

  it('refuses online cancellation once the client has checked in', async () => {
    const { reference } = await service.create(request());
    await repo.updateStatus(repo.bookings[0].id, 'CHECKED_IN', clock.now());
    await expect(service.cancel(reference)).rejects.toThrow(
      'ไม่สามารถยกเลิกออนไลน์',
    );
  });

  it('throws 404 for an unknown reference', async () => {
    await expect(
      service.findByReference('HNA-000000-XXXX'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('masking helpers', () => {
  it('masks phone numbers and emails', () => {
    expect(maskPhone('0812345678')).toBe('081-xxx-5678');
    expect(maskEmail('a@b.com')).toBe('a*@b.com');
  });
});
