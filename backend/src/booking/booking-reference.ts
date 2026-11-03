import { randomInt } from 'node:crypto';
import { toBangkokDate } from '../common/bangkok-time.js';

// No 0/O or 1/I/L so references are easy to read out over the phone.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Human-friendly booking reference, e.g. "HNA-691118-K3F2":
 * Thai Buddhist year (2569 -> 69), month and day of the appointment, then 4 random characters.
 */
export function generateBookingReference(appointmentStart: Date): string {
  const [year, month, day] = toBangkokDate(appointmentStart).split('-');
  const buddhistYear = String(Number(year) + 543).slice(-2);
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `HNA-${buddhistYear}${month}${day}-${suffix}`;
}
