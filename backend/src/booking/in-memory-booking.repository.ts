import { randomUUID } from 'node:crypto';
import {
  BookingRepository,
  DuplicateReferenceError,
} from './booking.repository.js';
import {
  BLOCKING_STATUSES,
  type Booking,
  type BookingStatus,
  type BusyPeriod,
  type NewBooking,
} from './booking.types.js';
import { overlaps } from './slot-calculator.js';

/** Test double that follows the same contract as the Prisma repository. */
export class InMemoryBookingRepository extends BookingRepository {
  readonly bookings: Booking[] = [];

  async findBusyPeriods(
    doctorIds: string[],
    from: Date,
    to: Date,
  ): Promise<BusyPeriod[]> {
    return this.bookings.filter(
      (b) =>
        BLOCKING_STATUSES.includes(b.status) &&
        doctorIds.includes(b.doctorId) &&
        overlaps(b, { startAt: from, endAt: to }),
    );
  }

  async createIfSlotFree(input: NewBooking): Promise<Booking | null> {
    if (this.bookings.some((b) => b.reference === input.reference)) {
      throw new DuplicateReferenceError(input.reference);
    }
    const busy = await this.findBusyPeriods(
      [input.doctorId],
      input.startAt,
      input.endAt,
    );
    if (busy.length > 0) return null;

    const booking: Booking = {
      ...input,
      id: randomUUID(),
      status: 'CONFIRMED',
      createdAt: new Date(),
      cancelledAt: null,
      statusAt: null,
    };
    this.bookings.push(booking);
    return booking;
  }

  async findByReference(reference: string) {
    return this.bookings.find((b) => b.reference === reference) ?? null;
  }

  async findByPhone(phone: string) {
    return this.bookings
      .filter((b) => b.phone === phone)
      .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
  }

  async markCancelled(id: string, at: Date) {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) throw new Error(`Booking ${id} not found`);
    booking.status = 'CANCELLED';
    booking.cancelledAt = at;
    booking.statusAt = at;
    return booking;
  }

  async updateStatus(id: string, status: BookingStatus, at: Date) {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) throw new Error(`Booking ${id} not found`);
    booking.status = status;
    booking.statusAt = at;
    if (status === 'CANCELLED') booking.cancelledAt = at;
    return booking;
  }

  async findStartingBetween(from: Date, to: Date, branchId?: string) {
    return this.bookings
      .filter(
        (b) =>
          b.startAt >= from &&
          b.startAt < to &&
          (!branchId || b.branchId === branchId),
      )
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }
}
