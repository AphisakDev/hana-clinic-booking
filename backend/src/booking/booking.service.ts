import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CatalogRepository } from '../catalog/catalog.repository.js';
import type { Branch, Doctor, Treatment } from '../catalog/catalog.types.js';
import {
  addMinutes,
  bangkokDateTime,
  daysBetween,
  isValidDateString,
  toBangkokDate,
  toBangkokTime,
} from '../common/bangkok-time.js';
import { Clock } from '../common/clock.js';
import { generateBookingReference } from './booking-reference.js';
import {
  BookingRepository,
  DuplicateReferenceError,
} from './booking.repository.js';
import type { Booking, TimeSlot } from './booking.types.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import { SlotCalculator } from './slot-calculator.js';
import { TimeBlockRepository } from './time-block.repository.js';

export interface AvailabilityRequest {
  treatmentSlug: string;
  branchSlug: string;
  date: string;
  doctorSlug?: string;
}

export interface AvailabilityView {
  date: string;
  durationMin: number;
  slots: { time: string; available: boolean }[];
}

export interface BookingView {
  reference: string;
  status: Booking['status'];
  date: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  customerName: string;
  phone: string;
  email: string;
  note: string | null;
  treatment: Pick<
    Treatment,
    'slug' | 'name' | 'priceThb' | 'durationMin' | 'imageUrl'
  >;
  branch: Pick<Branch, 'slug' | 'name' | 'address' | 'transit'>;
  doctor: Pick<Doctor, 'slug' | 'name' | 'title'>;
  cancelDeadline: string;
  canCancel: boolean;
}

interface BookingContext {
  treatment: Treatment;
  branch: Branch;
  doctors: Doctor[];
}

@Injectable()
export class BookingService {
  static readonly MAX_DAYS_AHEAD = 60;
  static readonly CANCEL_NOTICE_HOURS = 24;
  private static readonly REFERENCE_ATTEMPTS = 3;

  constructor(
    private readonly bookings: BookingRepository,
    private readonly catalog: CatalogRepository,
    private readonly slots: SlotCalculator,
    private readonly clock: Clock,
    private readonly timeBlocks: TimeBlockRepository,
  ) {}

  async getAvailability(req: AvailabilityRequest): Promise<AvailabilityView> {
    const ctx = await this.resolveContext(req);
    const slots = await this.computeSlots(ctx, req.date);
    return {
      date: req.date,
      durationMin: ctx.treatment.durationMin,
      slots: slots.map(({ time, available }) => ({ time, available })),
    };
  }

  async create(dto: CreateBookingDto): Promise<BookingView> {
    const ctx = await this.resolveContext({
      treatmentSlug: dto.treatmentSlug,
      branchSlug: dto.branchSlug,
      doctorSlug: dto.doctorSlug,
      date: dto.date,
    });

    const slot = (await this.computeSlots(ctx, dto.date)).find(
      (s) => s.time === dto.time,
    );
    if (!slot) {
      throw new BadRequestException('เวลานี้ไม่อยู่ในช่วงเวลาที่จองได้');
    }

    // Try each free doctor in turn; another request may have taken one
    // between reading availability and writing the booking.
    for (const doctorId of slot.availableDoctorIds) {
      const booking = await this.tryCreate(dto, slot, ctx, doctorId);
      if (booking) return this.toView(booking, ctx.treatment, ctx.branch);
    }
    throw new ConflictException('คิวนี้เพิ่งถูกจองไป กรุณาเลือกเวลาอื่น');
  }

  async findByReference(reference: string): Promise<BookingView> {
    const booking = await this.getBooking(reference);
    const [treatment, branch] = await Promise.all([
      this.catalog.findTreatmentById(booking.treatmentId),
      this.catalog.findBranchById(booking.branchId),
    ]);
    if (!treatment || !branch) throw new NotFoundException('ไม่พบการจองนี้');
    return this.toView(booking, treatment, branch);
  }

  /** All bookings for a (verified) phone number, newest first. */
  async findByPhone(phone: string): Promise<BookingView[]> {
    const bookings = await this.bookings.findByPhone(phone);
    const views = await Promise.all(
      bookings.map(async (booking) => {
        const [treatment, branch] = await Promise.all([
          this.catalog.findTreatmentById(booking.treatmentId),
          this.catalog.findBranchById(booking.branchId),
        ]);
        return treatment && branch
          ? this.toView(booking, treatment, branch)
          : null;
      }),
    );
    return views.filter((v): v is BookingView => v !== null);
  }

  async cancel(reference: string): Promise<BookingView> {
    const booking = await this.getBooking(reference);
    if (booking.status === 'CANCELLED') {
      throw new ConflictException('การจองนี้ถูกยกเลิกไปแล้ว');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new ConflictException('นัดหมายนี้ไม่สามารถยกเลิกออนไลน์ได้แล้ว');
    }
    const now = this.clock.now();
    if (now > this.cancelDeadline(booking)) {
      throw new ConflictException(
        `ยกเลิกออนไลน์ได้ก่อนเวลานัด ${BookingService.CANCEL_NOTICE_HOURS} ชม. กรุณาติดต่อสาขา`,
      );
    }
    await this.bookings.markCancelled(booking.id, now);
    return this.findByReference(booking.reference);
  }

  // --- helpers -------------------------------------------------------------

  private async resolveContext(
    req: AvailabilityRequest,
  ): Promise<BookingContext> {
    this.assertBookableDate(req.date);

    const [treatment, branch] = await Promise.all([
      this.catalog.findTreatmentBySlug(req.treatmentSlug),
      this.catalog.findBranchBySlug(req.branchSlug),
    ]);
    if (!treatment) throw new NotFoundException('ไม่พบทรีตเมนต์นี้');
    if (!branch) throw new NotFoundException('ไม่พบสาขานี้');

    const branchDoctors = await this.catalog.findDoctors(branch.id);
    const wanted = req.doctorSlug && req.doctorSlug !== 'any';
    const doctors = wanted
      ? branchDoctors.filter((d) => d.slug === req.doctorSlug)
      : branchDoctors;
    if (wanted && doctors.length === 0) {
      throw new BadRequestException('แพทย์ท่านนี้ไม่ได้ประจำสาขาที่เลือก');
    }
    return { treatment, branch, doctors };
  }

  private assertBookableDate(date: string) {
    if (!isValidDateString(date)) {
      throw new BadRequestException('วันที่ไม่ถูกต้อง');
    }
    const daysAhead = daysBetween(toBangkokDate(this.clock.now()), date);
    if (daysAhead < 0) {
      throw new BadRequestException('ไม่สามารถจองย้อนหลังได้');
    }
    if (daysAhead > BookingService.MAX_DAYS_AHEAD) {
      throw new BadRequestException(
        `จองล่วงหน้าได้ไม่เกิน ${BookingService.MAX_DAYS_AHEAD} วัน`,
      );
    }
  }

  private async computeSlots(
    { treatment, branch, doctors }: BookingContext,
    date: string,
  ): Promise<TimeSlot[]> {
    const doctorIds = doctors.map((d) => d.id);
    const from = bangkokDateTime(date, branch.openTime);
    const to = bangkokDateTime(date, branch.closeTime);
    // Bookings and staff-made blocks (leave, meetings) both take a doctor's time.
    const [booked, blocked] = await Promise.all([
      this.bookings.findBusyPeriods(doctorIds, from, to),
      this.timeBlocks.findOverlapping(doctorIds, from, to),
    ]);
    const busy = [...booked, ...blocked];
    return this.slots.calculate({
      date,
      openTime: branch.openTime,
      closeTime: branch.closeTime,
      durationMin: treatment.durationMin,
      doctorIds,
      busy,
      now: this.clock.now(),
    });
  }

  private async tryCreate(
    dto: CreateBookingDto,
    slot: TimeSlot,
    ctx: BookingContext,
    doctorId: string,
  ): Promise<Booking | null> {
    for (let i = 0; i < BookingService.REFERENCE_ATTEMPTS; i++) {
      try {
        return await this.bookings.createIfSlotFree({
          reference: generateBookingReference(slot.startAt),
          startAt: slot.startAt,
          endAt: slot.endAt,
          customerName: dto.customerName,
          phone: dto.phone,
          email: dto.email,
          note: dto.note ?? null,
          treatmentId: ctx.treatment.id,
          branchId: ctx.branch.id,
          doctorId,
        });
      } catch (error) {
        if (!(error instanceof DuplicateReferenceError)) throw error;
      }
    }
    throw new ConflictException('ระบบไม่ว่างชั่วคราว กรุณาลองใหม่');
  }

  private async getBooking(reference: string): Promise<Booking> {
    const booking = await this.bookings.findByReference(
      reference.trim().toUpperCase(),
    );
    if (!booking) throw new NotFoundException('ไม่พบการจองนี้');
    return booking;
  }

  private cancelDeadline(booking: Booking): Date {
    return addMinutes(
      booking.startAt,
      -BookingService.CANCEL_NOTICE_HOURS * 60,
    );
  }

  private async toView(
    booking: Booking,
    treatment: Treatment,
    branch: Branch,
  ): Promise<BookingView> {
    const doctor = await this.catalog.findDoctorById(booking.doctorId);
    const deadline = this.cancelDeadline(booking);
    return {
      reference: booking.reference,
      status: booking.status,
      date: toBangkokDate(booking.startAt),
      startTime: toBangkokTime(booking.startAt),
      endTime: toBangkokTime(booking.endAt),
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      customerName: booking.customerName,
      // Anyone with the reference can open this page, so personal
      // details are partly masked.
      phone: maskPhone(booking.phone),
      email: maskEmail(booking.email),
      note: booking.note,
      treatment: {
        slug: treatment.slug,
        name: treatment.name,
        priceThb: treatment.priceThb,
        durationMin: treatment.durationMin,
        imageUrl: treatment.imageUrl,
      },
      branch: {
        slug: branch.slug,
        name: branch.name,
        address: branch.address,
        transit: branch.transit,
      },
      doctor: {
        slug: doctor?.slug ?? '',
        name: doctor?.name ?? 'แพทย์ประจำสาขา',
        title: doctor?.title ?? '',
      },
      cancelDeadline: deadline.toISOString(),
      canCancel: booking.status === 'CONFIRMED' && this.clock.now() <= deadline,
    };
  }
}

export function maskPhone(phone: string): string {
  return phone.length < 7
    ? phone
    : `${phone.slice(0, 3)}-xxx-${phone.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
}
