import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingRepository } from '../booking/booking.repository.js';
import {
  BLOCKING_STATUSES,
  type Booking,
  type BookingStatus,
  type TimeBlock,
} from '../booking/booking.types.js';
import { overlaps } from '../booking/slot-calculator.js';
import { TimeBlockRepository } from '../booking/time-block.repository.js';
import { CatalogRepository } from '../catalog/catalog.repository.js';
import type { Branch, Doctor, Treatment } from '../catalog/catalog.types.js';
import {
  addMinutes,
  bangkokDateTime,
  isValidDateString,
  toBangkokDate,
  toBangkokTime,
} from '../common/bangkok-time.js';
import { Clock } from '../common/clock.js';
import { allowedNextStatuses, canChangeStatus } from './status-rules.js';

export interface AdminBookingView {
  reference: string;
  status: BookingStatus;
  nextStatuses: BookingStatus[];
  startTime: string;
  endTime: string;
  customerName: string;
  /** Staff see the full contact details. */
  phone: string;
  email: string;
  note: string | null;
  treatment: { slug: string; name: string; priceThb: number };
  doctorSlug: string;
}

export interface TimeBlockView {
  id: string;
  doctorSlug: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface ScheduleView {
  date: string;
  branch: Pick<Branch, 'slug' | 'name' | 'openTime' | 'closeTime'>;
  doctors: {
    slug: string;
    name: string;
    title: string;
    bookings: AdminBookingView[];
    blocks: TimeBlockView[];
  }[];
  summary: {
    total: number;
    byStatus: Record<BookingStatus, number>;
    expectedRevenueThb: number;
  };
}

export interface StatsView {
  today: string;
  todayBookings: number;
  todayTotal: number;
  todayByStatus: Record<BookingStatus, number>;
  todayRevenueThb: number;
  todayCompletedRevenueThb: number;
  next7DaysBookings: number;
  /** Share of past appointments (last 30 days) where the client did not come. */
  noShowRate30d: number | null;
  topTreatments30d: { slug: string; name: string; count: number }[];
  daily: { date: string; bookings: number }[];
}

export interface CreateBlockInput {
  doctorSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly blocks: TimeBlockRepository,
    private readonly catalog: CatalogRepository,
    private readonly clock: Clock,
  ) {}

  async getSchedule(date: string, branchSlug: string): Promise<ScheduleView> {
    if (!isValidDateString(date))
      throw new BadRequestException('วันที่ไม่ถูกต้อง');
    const branch = await this.getBranch(branchSlug);
    const doctors = await this.catalog.findDoctors(branch.id);
    const dayStart = bangkokDateTime(date, '00:00');
    const dayEnd = addMinutes(dayStart, 24 * 60);

    const [bookings, blocks, treatments] = await Promise.all([
      this.bookings.findStartingBetween(dayStart, dayEnd, branch.id),
      this.blocks.findOverlapping(
        doctors.map((d) => d.id),
        dayStart,
        dayEnd,
      ),
      this.treatmentsById(),
    ]);

    const views = bookings.map((b) =>
      this.toBookingView(b, treatments, doctors),
    );
    const byStatus = emptyStatusCount();
    for (const b of bookings) byStatus[b.status]++;

    return {
      date,
      branch: {
        slug: branch.slug,
        name: branch.name,
        openTime: branch.openTime,
        closeTime: branch.closeTime,
      },
      doctors: doctors.map((d) => ({
        slug: d.slug,
        name: d.name,
        title: d.title,
        bookings: views.filter((v) => v.doctorSlug === d.slug),
        blocks: blocks
          .filter((b) => b.doctorId === d.id)
          .map((b) => this.toBlockView(b, d)),
      })),
      summary: {
        total: bookings.filter((b) => b.status !== 'CANCELLED').length,
        byStatus,
        expectedRevenueThb: sumRevenue(bookings, treatments),
      },
    };
  }

  async changeStatus(reference: string, status: BookingStatus) {
    const booking = await this.bookings.findByReference(
      reference.trim().toUpperCase(),
    );
    if (!booking) throw new NotFoundException('ไม่พบการจองนี้');
    if (booking.status === status) {
      throw new ConflictException('นัดหมายอยู่ในสถานะนี้อยู่แล้ว');
    }
    if (!canChangeStatus(booking.status, status)) {
      throw new ConflictException(
        `เปลี่ยนสถานะจาก ${booking.status} เป็น ${status} ไม่ได้`,
      );
    }
    const updated = await this.bookings.updateStatus(
      booking.id,
      status,
      this.clock.now(),
    );
    const [treatments, doctors] = await Promise.all([
      this.treatmentsById(),
      this.catalog.findDoctors(),
    ]);
    return this.toBookingView(updated, treatments, doctors);
  }

  async createBlock(input: CreateBlockInput): Promise<TimeBlockView> {
    const doctor = await this.catalog.findDoctorBySlug(input.doctorSlug);
    if (!doctor) throw new NotFoundException('ไม่พบแพทย์ท่านนี้');
    if (!isValidDateString(input.date))
      throw new BadRequestException('วันที่ไม่ถูกต้อง');
    if (input.startTime >= input.endTime) {
      throw new BadRequestException('เวลาเริ่มต้องก่อนเวลาสิ้นสุด');
    }
    const startAt = bangkokDateTime(input.date, input.startTime);
    const endAt = bangkokDateTime(input.date, input.endTime);

    // Blocking over an existing appointment would silently strand a client.
    const clashes = await this.bookings.findBusyPeriods(
      [doctor.id],
      startAt,
      endAt,
    );
    if (clashes.length > 0) {
      throw new ConflictException(
        `มีนัดของคนไข้ ${clashes.length} รายการในช่วงนี้ กรุณาเลื่อนหรือยกเลิกนัดก่อน`,
      );
    }
    const existing = await this.blocks.findOverlapping(
      [doctor.id],
      startAt,
      endAt,
    );
    if (existing.some((b) => overlaps(b, { startAt, endAt }))) {
      throw new ConflictException('ช่วงเวลานี้ถูกบล็อกไว้แล้ว');
    }

    const block = await this.blocks.create({
      doctorId: doctor.id,
      startAt,
      endAt,
      reason: input.reason.trim(),
    });
    return this.toBlockView(block, doctor);
  }

  async deleteBlock(id: string): Promise<void> {
    const block = await this.blocks.findById(id);
    if (!block) throw new NotFoundException('ไม่พบช่วงเวลาที่บล็อกไว้');
    await this.blocks.delete(id);
  }

  async getStats(branchSlug?: string): Promise<StatsView> {
    const branch = branchSlug ? await this.getBranch(branchSlug) : undefined;
    const now = this.clock.now();
    const today = toBangkokDate(now);
    const todayStart = bangkokDateTime(today, '00:00');
    const day = (n: number) => addMinutes(todayStart, n * 24 * 60);

    const [recent, treatments] = await Promise.all([
      this.bookings.findStartingBetween(day(-30), day(7), branch?.id),
      this.treatmentsById(),
    ]);
    const allToday = recent.filter(
      (b) => b.startAt >= day(0) && b.startAt < day(1),
    );
    const todayByStatus = emptyStatusCount();
    for (const b of allToday) {
      todayByStatus[b.status]++;
    }

    const active = recent.filter((b) => b.status !== 'CANCELLED');
    const todays = active.filter(
      (b) => b.startAt >= day(0) && b.startAt < day(1),
    );
    const upcoming = active.filter(
      (b) => b.startAt >= day(0) && b.startAt < day(7),
    );

    // Only appointments that have already happened can be a no-show.
    const past = active.filter((b) => b.endAt <= now);
    const noShows = past.filter((b) => b.status === 'NO_SHOW').length;

    const counts = new Map<string, number>();
    for (const b of active.filter((b) => b.startAt < day(1))) {
      counts.set(b.treatmentId, (counts.get(b.treatmentId) ?? 0) + 1);
    }
    const topTreatments30d = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({
        slug: treatments.get(id)?.slug ?? id,
        name: treatments.get(id)?.name ?? '—',
        count,
      }));

    const daily = Array.from({ length: 7 }, (_, i) => {
      const date = toBangkokDate(day(i));
      return {
        date,
        bookings: upcoming.filter((b) => toBangkokDate(b.startAt) === date)
          .length,
      };
    });

    return {
      today,
      todayBookings: todays.length,
      todayTotal: allToday.length,
      todayByStatus,
      todayRevenueThb: sumRevenue(todays, treatments),
      todayCompletedRevenueThb: sumCompletedRevenue(todays, treatments),
      next7DaysBookings: upcoming.length,
      noShowRate30d: past.length
        ? Math.round((noShows / past.length) * 1000) / 1000
        : null,
      topTreatments30d,
      daily,
    };
  }

  // --- helpers -------------------------------------------------------------

  private async getBranch(slug: string): Promise<Branch> {
    const branch = await this.catalog.findBranchBySlug(slug);
    if (!branch) throw new NotFoundException('ไม่พบสาขานี้');
    return branch;
  }

  private async treatmentsById(): Promise<Map<string, Treatment>> {
    const all = await this.catalog.findTreatments();
    return new Map(all.map((t) => [t.id, t]));
  }

  private toBookingView(
    b: Booking,
    treatments: Map<string, Treatment>,
    doctors: Doctor[],
  ): AdminBookingView {
    const t = treatments.get(b.treatmentId);
    return {
      reference: b.reference,
      status: b.status,
      nextStatuses: allowedNextStatuses(b.status),
      startTime: toBangkokTime(b.startAt),
      endTime: toBangkokTime(b.endAt),
      customerName: b.customerName,
      phone: b.phone,
      email: b.email,
      note: b.note,
      treatment: {
        slug: t?.slug ?? '',
        name: t?.name ?? '—',
        priceThb: t?.priceThb ?? 0,
      },
      doctorSlug: doctors.find((d) => d.id === b.doctorId)?.slug ?? '',
    };
  }

  private toBlockView(b: TimeBlock, doctor: Doctor): TimeBlockView {
    return {
      id: b.id,
      doctorSlug: doctor.slug,
      startTime: toBangkokTime(b.startAt),
      endTime: toBangkokTime(b.endAt),
      reason: b.reason,
    };
  }
}

function emptyStatusCount(): Record<BookingStatus, number> {
  return {
    CONFIRMED: 0,
    CHECKED_IN: 0,
    COMPLETED: 0,
    NO_SHOW: 0,
    CANCELLED: 0,
  };
}

/** Expected revenue: everything not cancelled and not a no-show. */
function sumRevenue(
  bookings: Booking[],
  treatments: Map<string, Treatment>,
): number {
  return bookings
    .filter(
      (b) => BLOCKING_STATUSES.includes(b.status) && b.status !== 'NO_SHOW',
    )
    .reduce(
      (sum, b) => sum + (treatments.get(b.treatmentId)?.priceThb ?? 0),
      0,
    );
}

/** Revenue actually collected from completed appointments. */
function sumCompletedRevenue(
  bookings: Booking[],
  treatments: Map<string, Treatment>,
): number {
  return bookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce(
      (sum, b) => sum + (treatments.get(b.treatmentId)?.priceThb ?? 0),
      0,
    );
}
