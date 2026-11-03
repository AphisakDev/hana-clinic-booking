import type { BookingStatus } from '../booking/booking.types.js';

/**
 * What staff may change a booking to, from each status.
 * COMPLETED, NO_SHOW and CANCELLED are final.
 */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  CONFIRMED: ['CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
  CHECKED_IN: ['COMPLETED', 'CONFIRMED'], // CONFIRMED = undo a mistaken check-in
  COMPLETED: [],
  NO_SHOW: ['CONFIRMED'], // undo, e.g. the client was only late
  CANCELLED: [],
};

export function allowedNextStatuses(from: BookingStatus): BookingStatus[] {
  return TRANSITIONS[from];
}

export function canChangeStatus(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}
