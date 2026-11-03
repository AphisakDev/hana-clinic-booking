import { Injectable } from '@nestjs/common';
import {
  addMinutes,
  bangkokDateTime,
  minutesToTime,
  timeToMinutes,
} from '../common/bangkok-time.js';
import type { BusyPeriod, TimeSlot } from './booking.types.js';

export interface SlotRequest {
  /** "YYYY-MM-DD" (Bangkok) */
  date: string;
  openTime: string;
  closeTime: string;
  durationMin: number;
  doctorIds: string[];
  busy: BusyPeriod[];
  now: Date;
}

interface Range {
  startAt: Date;
  endAt: Date;
}

/** Half-open ranges [start, end) overlap when each starts before the other ends. */
export function overlaps(a: Range, b: Range): boolean {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

/**
 * Pure scheduling rules, no I/O, so they are cheap to unit test:
 * - slots start every {@link SlotCalculator.STEP_MIN} minutes from opening time
 * - the treatment must finish by closing time
 * - a slot must start at least {@link SlotCalculator.LEAD_TIME_MIN} minutes from now
 * - a slot is available if at least one doctor is free for the whole duration
 */
@Injectable()
export class SlotCalculator {
  static readonly STEP_MIN = 30;
  static readonly LEAD_TIME_MIN = 60;

  calculate(req: SlotRequest): TimeSlot[] {
    const open = timeToMinutes(req.openTime);
    const lastStart = timeToMinutes(req.closeTime) - req.durationMin;
    const earliest = addMinutes(req.now, SlotCalculator.LEAD_TIME_MIN);
    const slots: TimeSlot[] = [];

    for (let m = open; m <= lastStart; m += SlotCalculator.STEP_MIN) {
      const time = minutesToTime(m);
      const startAt = bangkokDateTime(req.date, time);
      const endAt = addMinutes(startAt, req.durationMin);
      const slot = { startAt, endAt };

      const availableDoctorIds =
        startAt < earliest
          ? []
          : req.doctorIds.filter(
              (doctorId) =>
                !req.busy.some(
                  (b) => b.doctorId === doctorId && overlaps(b, slot),
                ),
            );

      slots.push({
        time,
        startAt,
        endAt,
        available: availableDoctorIds.length > 0,
        availableDoctorIds,
      });
    }
    return slots;
  }
}
