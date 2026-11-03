import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api.service';
import { formatBaht, formatThaiDate, weekdayOf } from '../../core/format';
import { Icon } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { AuthService } from '../auth.service';
import { BranchPicker } from '../branch-picker';
import { BookingStatus, STATUS_LABELS } from '../admin.models';

const SHORT_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink, Icon, BranchPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.css',
})
export class AdminDashboardPage {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly branch = signal('');
  protected readonly labels = STATUS_LABELS;
  protected readonly statusOrder: BookingStatus[] = [
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'NO_SHOW',
    'CANCELLED',
  ];

  protected readonly stats = rxResource({
    params: () => this.branch() || undefined,
    stream: ({ params }) => this.api.getStats(params),
  });

  protected readonly lastUpdated = signal(this.formatCurrentTime());

  protected readonly error = computed(() =>
    this.stats.error() ? errorMessage(this.stats.error()) : null,
  );

  /** Bars scaled to the busiest day (at least 1 so empty weeks still draw). */
  protected readonly bars = computed(() => {
    const daily = this.stats.value()?.daily ?? [];
    const max = Math.max(1, ...daily.map((d) => d.bookings));
    return daily.map((d, i) => ({
      ...d,
      label: i === 0 ? 'วันนี้' : SHORT_WEEKDAYS[weekdayOf(d.date)],
      day: Number(d.date.slice(8)),
      height: Math.round((d.bookings / max) * 100),
    }));
  });

  protected readonly baht = formatBaht;
  protected readonly thaiDate = formatThaiDate;
  protected percent(rate: number | null): string {
    return rate === null ? '—' : `${Math.round(rate * 100)}%`;
  }

  constructor() {
    effect(() => {
      if (this.stats.value()) {
        this.lastUpdated.set(this.formatCurrentTime());
      }
    });

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.stats.isLoading()) {
        this.stats.reload();
      }
    }, 15000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        this.stats.reload();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    this.destroyRef.onDestroy(() => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  protected reload() {
    this.stats.reload();
  }

  private formatCurrentTime(): string {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss} น.`;
  }
}
