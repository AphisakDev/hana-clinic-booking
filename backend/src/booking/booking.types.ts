export const BOOKING_STATUSES = [
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Every status except CANCELLED keeps the doctor's time taken. */
export const BLOCKING_STATUSES: BookingStatus[] = [
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'NO_SHOW',
];

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  startAt: Date;
  endAt: Date;
  customerName: string;
  phone: string;
  email: string;
  note: string | null;
  treatmentId: string;
  doctorId: string;
  branchId: string;
  createdAt: Date;
  cancelledAt: Date | null;
  /** When the status last changed (check-in, completed, ...). */
  statusAt: Date | null;
}

export type NewBooking = Omit<
  Booking,
  'id' | 'status' | 'createdAt' | 'cancelledAt' | 'statusAt'
>;

/** A period when a doctor is unavailable (leave, meeting, ...). */
export interface TimeBlock {
  id: string;
  doctorId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  createdAt: Date;
}

export type NewTimeBlock = Omit<TimeBlock, 'id' | 'createdAt'>;

/** A period that blocks a doctor's calendar. */
export interface BusyPeriod {
  doctorId: string;
  startAt: Date;
  endAt: Date;
}

export interface TimeSlot {
  /** "HH:mm" in Bangkok time */
  time: string;
  startAt: Date;
  endAt: Date;
  available: boolean;
  /** Doctors who are free for the whole slot */
  availableDoctorIds: string[];
}
