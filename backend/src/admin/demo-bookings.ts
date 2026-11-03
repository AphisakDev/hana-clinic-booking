import type { BookingStatus } from '../booking/booking.types.js';

export interface DemoBooking {
  dayOffset: number;
  time: string;
  branchSlug: string;
  doctorSlug: string;
  treatmentSlug: string;
  customerName: string;
  phone: string;
  status: BookingStatus;
}

const people = [
  ['มายด์ ศิริพร', '0891231840'],
  ['ปาล์ม ณัฐวุฒิ', '0812345678'],
  ['แพรว อรอุมา', '0867778899'],
  ['บีม กิตติพงษ์', '0823334455'],
  ['ฝน วรรณิษา', '0954445566'],
  ['ต้นข้าว ภัทรา', '0631112233'],
] as const;

const plan: [number, string, string, string, string, BookingStatus][] = [
  // dayOffset, time, branch, doctor, treatment, status
  [-3, '11:00', 'siam', 'napatsorn', 'hydrafacial', 'COMPLETED'],
  [-3, '14:00', 'siam', 'thanakorn', 'filler-contour', 'NO_SHOW'],
  [-2, '12:00', 'siam', 'napatsorn', 'laser-hair-removal', 'COMPLETED'],
  [-2, '10:00', 'ari', 'pimchanok', 'meso-brightening', 'COMPLETED'],
  [-1, '15:00', 'siam', 'thanakorn', 'thread-lift', 'COMPLETED'],
  [-1, '11:00', 'ari', 'kittipat', 'doctor-consultation', 'COMPLETED'],
  [0, '11:00', 'siam', 'napatsorn', 'hydrafacial', 'COMPLETED'],
  [0, '12:30', 'siam', 'thanakorn', 'doctor-consultation', 'CHECKED_IN'],
  [0, '14:00', 'siam', 'napatsorn', 'meso-brightening', 'CONFIRMED'],
  [0, '16:00', 'siam', 'thanakorn', 'filler-contour', 'CONFIRMED'],
  [0, '18:00', 'siam', 'napatsorn', 'laser-hair-removal', 'CONFIRMED'],
  [0, '13:00', 'ari', 'pimchanok', 'hydrafacial', 'CONFIRMED'],
  [1, '11:30', 'siam', 'napatsorn', 'hydrafacial', 'CONFIRMED'],
  [1, '15:00', 'siam', 'thanakorn', 'thread-lift', 'CONFIRMED'],
  [2, '13:00', 'siam', 'napatsorn', 'doctor-consultation', 'CONFIRMED'],
  [3, '17:00', 'siam', 'thanakorn', 'filler-contour', 'CONFIRMED'],
];

/** Sample appointments around "today" so the admin pages are not empty in a demo. */
export const DEMO_BOOKINGS: DemoBooking[] = plan.map(
  ([dayOffset, time, branchSlug, doctorSlug, treatmentSlug, status], i) => ({
    dayOffset,
    time,
    branchSlug,
    doctorSlug,
    treatmentSlug,
    status,
    customerName: people[i % people.length][0],
    phone: people[i % people.length][1],
  }),
);
