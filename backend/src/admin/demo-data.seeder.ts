import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { generateBookingReference } from '../booking/booking-reference.js';
import { BookingRepository } from '../booking/booking.repository.js';
import { CatalogRepository } from '../catalog/catalog.repository.js';
import {
  addMinutes,
  bangkokDateTime,
  toBangkokDate,
} from '../common/bangkok-time.js';
import { Clock } from '../common/clock.js';
import { DEMO_BOOKINGS } from './demo-bookings.js';

/** In-memory mode only: fills the empty store with sample appointments on startup. */
@Injectable()
export class DemoDataSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoDataSeeder.name);

  constructor(
    private readonly bookings: BookingRepository,
    private readonly catalog: CatalogRepository,
    private readonly clock: Clock,
  ) {}

  async onApplicationBootstrap() {
    const today = toBangkokDate(this.clock.now());
    const todayStart = bangkokDateTime(today, '00:00');
    let created = 0;

    for (const demo of DEMO_BOOKINGS) {
      const [treatment, branch, doctor] = await Promise.all([
        this.catalog.findTreatmentBySlug(demo.treatmentSlug),
        this.catalog.findBranchBySlug(demo.branchSlug),
        this.catalog.findDoctorBySlug(demo.doctorSlug),
      ]);
      if (!treatment || !branch || !doctor) continue;

      const date = toBangkokDate(
        addMinutes(todayStart, demo.dayOffset * 24 * 60),
      );
      const startAt = bangkokDateTime(date, demo.time);
      const booking = await this.bookings.createIfSlotFree({
        reference: generateBookingReference(startAt),
        startAt,
        endAt: addMinutes(startAt, treatment.durationMin),
        customerName: demo.customerName,
        phone: demo.phone,
        email: 'demo@example.com',
        note: null,
        treatmentId: treatment.id,
        branchId: branch.id,
        doctorId: doctor.id,
      });
      if (!booking) continue;
      if (demo.status !== 'CONFIRMED') {
        await this.bookings.updateStatus(booking.id, demo.status, startAt);
      }
      created++;
    }
    this.logger.log(`Demo mode: added ${created} sample bookings`);
  }
}
