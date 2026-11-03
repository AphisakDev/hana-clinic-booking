import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { errorMessage } from '../../core/api.service';
import { addDays, formatBaht, formatThaiDate, todayInBangkok } from '../../core/format';
import { Icon } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { AdminBooking, BookingStatus, STATUS_ACTIONS, STATUS_LABELS } from '../admin.models';
import { BranchPicker } from '../branch-picker';

/** Actions that cannot be undone ask for a second click. */
const NEEDS_CONFIRM: BookingStatus[] = ['CANCELLED', 'NO_SHOW'];

@Component({
  selector: 'app-admin-schedule-page',
  imports: [ReactiveFormsModule, Icon, BranchPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-schedule-page.html',
  styleUrl: './admin-schedule-page.css',
})
export class AdminSchedulePage {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const interval = setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        !this.schedule.isLoading() &&
        !this.busy() &&
        !this.confirming() &&
        !this.showBlockForm()
      ) {
        this.schedule.reload();
      }
    }, 15000);

    const onVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        !this.busy() &&
        !this.confirming() &&
        !this.showBlockForm()
      ) {
        this.schedule.reload();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    this.destroyRef.onDestroy(() => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  protected readonly today = todayInBangkok();
  protected readonly date = signal(this.today);
  protected readonly branch = signal('');

  protected readonly schedule = rxResource({
    params: () => (this.branch() ? { date: this.date(), branch: this.branch() } : undefined),
    stream: ({ params }) => this.api.getSchedule(params.date, params.branch),
  });

  protected readonly loadError = computed(() =>
    this.schedule.error() ? errorMessage(this.schedule.error()) : null,
  );

  /** Status chips in the summary bar, in visit order. */
  protected readonly statusOrder: BookingStatus[] = [
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'NO_SHOW',
    'CANCELLED',
  ];
  protected readonly labels = STATUS_LABELS;
  protected readonly actions = STATUS_ACTIONS;

  /** "<reference>:<status>" while a destructive action waits for confirmation. */
  protected readonly confirming = signal<string | null>(null);
  /** Reference currently being updated (disables its buttons). */
  protected readonly busy = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  // --- block time form ------------------------------------------------------
  protected readonly showBlockForm = signal(false);
  protected readonly blockForm = this.fb.nonNullable.group({
    doctorSlug: ['', Validators.required],
    startTime: ['12:00', Validators.required],
    endTime: ['13:00', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(100)]],
  });
  protected readonly blockSaving = signal(false);
  protected readonly blockError = signal<string | null>(null);

  protected readonly thaiDate = formatThaiDate;
  protected readonly baht = formatBaht;

  protected shiftDay(delta: number) {
    this.date.update((d) => addDays(d, delta));
  }

  protected onDateInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.date.set(value);
  }

  protected act(booking: AdminBooking, status: BookingStatus) {
    const key = `${booking.reference}:${status}`;
    if (NEEDS_CONFIRM.includes(status) && this.confirming() !== key) {
      this.confirming.set(key);
      return;
    }
    this.confirming.set(null);
    this.busy.set(booking.reference);
    this.actionError.set(null);
    this.api.changeStatus(booking.reference, status).subscribe({
      next: () => {
        this.busy.set(null);
        this.schedule.reload();
      },
      error: (error: unknown) => {
        this.busy.set(null);
        this.actionError.set(errorMessage(error));
      },
    });
  }

  protected openBlockForm(doctorSlug = '') {
    this.blockForm.reset({ doctorSlug, startTime: '12:00', endTime: '13:00', reason: '' });
    this.blockError.set(null);
    this.showBlockForm.set(true);
  }

  protected saveBlock() {
    if (this.blockForm.invalid) {
      this.blockForm.markAllAsTouched();
      return;
    }
    const value = this.blockForm.getRawValue();
    if (value.startTime >= value.endTime) {
      this.blockError.set('เวลาเริ่มต้องก่อนเวลาสิ้นสุด');
      return;
    }
    this.blockSaving.set(true);
    this.blockError.set(null);
    this.api.createBlock({ ...value, date: this.date() }).subscribe({
      next: () => {
        this.blockSaving.set(false);
        this.showBlockForm.set(false);
        this.schedule.reload();
      },
      error: (error: unknown) => {
        this.blockSaving.set(false);
        this.blockError.set(errorMessage(error));
      },
    });
  }

  protected removeBlock(id: string) {
    this.api.deleteBlock(id).subscribe({
      next: () => this.schedule.reload(),
      error: (error: unknown) => this.actionError.set(errorMessage(error)),
    });
  }
}
