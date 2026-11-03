import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api.service';
import { buildMonthGrid, shiftMonth } from '../../core/calendar';
import {
  addDays,
  formatPrice,
  formatThaiDate,
  formatThaiMonth,
  parseIsoDate,
  todayInBangkok,
} from '../../core/format';
import { ImgFallback } from '../../shared/img-fallback';
import { Icon } from '../../shared/icon';

/** Must match BookingService.MAX_DAYS_AHEAD in the API. */
const MAX_DAYS_AHEAD = 60;

@Component({
  selector: 'app-booking-page',
  imports: [RouterLink, ReactiveFormsModule, Icon, ImgFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.css',
})
export class BookingPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Route parameter `:slug` and optional `?branch=` query parameter. */
  readonly slug = input.required<string>();
  readonly branch = input<string>();

  // --- data -----------------------------------------------------------------
  protected readonly treatment = rxResource({
    params: () => this.slug(),
    stream: ({ params }) => this.api.getTreatment(params),
  });
  protected readonly branches = rxResource({ stream: () => this.api.listBranches() });

  // --- selections -------------------------------------------------------------
  /** Starts from ?branch= (or the first branch) but the user can change it. */
  protected readonly branchSlug = linkedSignal(() => {
    const list = this.branches.hasValue() ? this.branches.value() : [];
    return list.find((b) => b.slug === this.branch())?.slug ?? list[0]?.slug ?? '';
  });

  protected readonly doctors = rxResource({
    params: () => this.branchSlug() || undefined,
    stream: ({ params }) => this.api.listDoctors(params),
  });

  /** 'any' = first available doctor. Resets when the branch changes. */
  protected readonly doctorSlug = linkedSignal<string, string>({
    source: this.branchSlug,
    computation: () => 'any',
  });

  protected readonly today = todayInBangkok();
  protected readonly maxDate = addDays(this.today, MAX_DAYS_AHEAD);
  /** Late in the evening today's slots are gone, so start from tomorrow. */
  protected readonly date = signal(bangkokHour() >= 18 ? addDays(this.today, 1) : this.today);

  private readonly todayParts = parseIsoDate(this.date());
  protected readonly viewMonth = signal({
    year: this.todayParts.year,
    month: this.todayParts.month,
  });
  protected readonly monthLabel = computed(() =>
    formatThaiMonth(this.viewMonth().year, this.viewMonth().month),
  );
  protected readonly calendar = computed(() =>
    buildMonthGrid(this.viewMonth().year, this.viewMonth().month, this.today, this.maxDate),
  );
  protected readonly canGoBack = computed(() => this.calendar()[0].iso > this.today);
  protected readonly canGoForward = computed(() => this.calendar().at(-1)!.iso < this.maxDate);
  protected readonly weekdays = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

  protected readonly availability = rxResource({
    params: () =>
      this.branchSlug()
        ? {
            treatment: this.slug(),
            branch: this.branchSlug(),
            date: this.date(),
            doctor: this.doctorSlug(),
          }
        : undefined,
    stream: ({ params }) => this.api.getAvailability(params),
  });

  /** Picked time; cleared whenever the slots it came from change. */
  protected readonly time = linkedSignal<unknown, string | null>({
    source: () => [this.branchSlug(), this.doctorSlug(), this.date()],
    computation: () => null,
  });

  protected readonly morningSlots = computed(() => this.slots().filter((s) => s.time < '12:00'));
  protected readonly afternoonSlots = computed(() => this.slots().filter((s) => s.time >= '12:00'));
  protected readonly freeCount = computed(() => this.slots().filter((s) => s.available).length);
  private readonly slots = computed(() =>
    this.availability.hasValue() ? this.availability.value().slots : [],
  );

  // --- summary --------------------------------------------------------------
  protected readonly selectedBranch = computed(() =>
    this.branches.hasValue()
      ? this.branches.value().find((b) => b.slug === this.branchSlug())
      : undefined,
  );
  protected readonly selectedDoctor = computed(() =>
    this.doctors.hasValue()
      ? this.doctors.value().find((d) => d.slug === this.doctorSlug())
      : undefined,
  );
  protected readonly endTime = computed(() => {
    const time = this.time();
    const t = this.treatment.hasValue() ? this.treatment.value() : undefined;
    if (!time || !t) return null;
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + t.durationMin;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  });

  // --- contact form ---------------------------------------------------------
  protected readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^0\d{2}-?\d{3}-?\d{3,4}$/)]],
    email: ['', [Validators.required, Validators.email]],
    note: ['', Validators.maxLength(300)],
  });

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  constructor() {
    // Opening a date in another month moves the calendar with it.
    effect(() => {
      const { year, month } = parseIsoDate(this.date());
      this.viewMonth.set({ year, month });
    });
  }

  protected readonly price = formatPrice;
  protected readonly thaiDate = formatThaiDate;

  protected moveMonth(delta: number) {
    this.viewMonth.update(({ year, month }) => shiftMonth(year, month, delta));
  }

  protected pickDate(iso: string) {
    this.date.set(iso);
    this.submitError.set(null);
  }

  protected showError(control: 'customerName' | 'phone' | 'email' | 'note'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit() {
    this.submitError.set(null);
    const time = this.time();
    if (!time) {
      this.submitError.set('กรุณาเลือกเวลานัด');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError.set('กรุณากรอกข้อมูลติดต่อให้ครบถ้วน');
      return;
    }

    const { note, ...contact } = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createBooking({
        treatmentSlug: this.slug(),
        branchSlug: this.branchSlug(),
        doctorSlug: this.doctorSlug(),
        date: this.date(),
        time,
        ...contact,
        note: note.trim() || undefined,
      })
      .subscribe({
        next: (booking) => {
          void this.router.navigate(['/bookings', booking.reference], {
            state: { justBooked: true },
          });
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.submitError.set(errorMessage(error));
          // Someone else took the slot: refresh so the user sees what's left.
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.time.set(null);
            this.availability.reload();
          }
        },
      });
  }
}

function bangkokHour(now: Date = new Date()): number {
  return (now.getUTCHours() + 7) % 24;
}
