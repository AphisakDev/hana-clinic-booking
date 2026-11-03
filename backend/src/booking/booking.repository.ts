import type {
  Booking,
  BookingStatus,
  BusyPeriod,
  NewBooking,
} from './booking.types.js';

/** Thrown when two people try to take the same reference (very rare). */
export class DuplicateReferenceError extends Error {}

export abstract class BookingRepository {
  /** Non-cancelled bookings for these doctors that overlap [from, to). */
  abstract findBusyPeriods(
    doctorIds: string[],
    from: Date,
    to: Date,
  ): Promise<BusyPeriod[]>;

  /**
   * Atomically checks the doctor is still free and saves the booking.
   * Returns `null` when the slot was taken in the meantime, so a double
   * booking can never be written, even with concurrent requests.
   */
  abstract createIfSlotFree(input: NewBooking): Promise<Booking | null>;

  abstract findByReference(reference: string): Promise<Booking | null>;

  /** Every booking made with this phone number, newest appointment first. */
  abstract findByPhone(phone: string): Promise<Booking[]>;

  abstract markCancelled(id: string, at: Date): Promise<Booking>;

  abstract updateStatus(
    id: string,
    status: BookingStatus,
    at: Date,
  ): Promise<Booking>;

  /** All bookings (any status) starting in [from, to), optionally for one branch. */
  abstract findStartingBetween(
    from: Date,
    to: Date,
    branchId?: string,
  ): Promise<Booking[]>;
}
