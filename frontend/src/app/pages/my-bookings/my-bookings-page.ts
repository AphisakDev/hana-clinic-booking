import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api.service';
import { CustomerSessionService, formatPhone } from '../../core/customer-session.service';
import { formatPrice, formatThaiDate, todayInBangkok } from '../../core/format';
import { Booking } from '../../core/models';
import { Icon } from '../../shared/icon';

type Mode = 'phone' | 'reference';

@Component({
  selector: 'app-my-bookings-page',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-bookings-page.html',
  styleUrl: './my-bookings-page.css',
})
export class MyBookingsPage {
  private readonly router = inject(Router);
  protected readonly session = inject(CustomerSessionService);

  protected readonly mode = signal<Mode>('phone');

  // --- look up by reference -------------------------------------------------
  protected readonly reference = signal('');

  protected openReference() {
    const ref = this.reference().trim().toUpperCase();
    if (ref) void this.router.navigate(['/bookings', ref]);
  }

  // --- look up by phone + OTP ----------------------------------------------
  protected readonly phone = signal('');
  protected readonly code = signal('');
  /** Phone the current code was sent to (null = still on the phone step). */
  protected readonly codeSentTo = signal<string | null>(null);
  protected readonly demoCode = signal<string | null>(null);
  protected readonly resendIn = signal(0);
  protected readonly sending = signal(false);
  protected readonly verifying = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly phoneValid = computed(() =>
    /^0\d{8,9}$/.test(this.phone().replace(/[\s-]/g, '')),
  );
  protected readonly codeValid = computed(() => /^\d{6}$/.test(this.code()));

  protected readonly bookings = rxResource({
    params: () => (this.session.isVerified() ? this.session.phone() : undefined),
    stream: () => this.session.myBookings(),
  });

  private readonly today = todayInBangkok();
  protected readonly upcoming = computed(
    () =>
      (this.bookings.value() ?? [])
        .filter((b) => b.date >= this.today && b.status !== 'CANCELLED')
        .reverse(), // soonest first
  );
  protected readonly past = computed(() =>
    (this.bookings.value() ?? []).filter((b) => b.date < this.today || b.status === 'CANCELLED'),
  );

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  protected readonly formatPhone = formatPhone;
  protected readonly thaiDate = formatThaiDate;
  protected readonly price = formatPrice;

  protected sendCode() {
    const phone = this.phone().replace(/[\s-]/g, '');
    if (!/^0\d{8,9}$/.test(phone) || this.sending() || this.resendIn() > 0) return;
    this.sending.set(true);
    this.error.set(null);
    this.session.requestCode(phone).subscribe({
      next: (result) => {
        this.sending.set(false);
        this.codeSentTo.set(phone);
        this.code.set('');
        this.demoCode.set(result.demoCode ?? null);
        this.startCountdown(result.resendInSec);
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(errorMessage(error));
        const wait = retryAfter(error);
        if (wait) this.startCountdown(wait);
      },
    });
  }

  protected verify() {
    const phone = this.codeSentTo();
    if (!phone || !this.codeValid() || this.verifying()) return;
    this.verifying.set(true);
    this.error.set(null);
    this.session.verify(phone, this.code()).subscribe({
      next: () => {
        this.verifying.set(false);
        this.codeSentTo.set(null);
        this.demoCode.set(null);
      },
      error: (error: unknown) => {
        this.verifying.set(false);
        this.code.set('');
        this.error.set(errorMessage(error));
      },
    });
  }

  protected changePhone() {
    this.codeSentTo.set(null);
    this.demoCode.set(null);
    this.code.set('');
    this.error.set(null);
  }

  protected signOut() {
    this.session.signOut();
    this.phone.set('');
    this.changePhone();
  }

  protected onCodeInput(value: string) {
    this.code.set(value.replace(/\D/g, '').slice(0, 6));
    if (this.codeValid()) this.verify();
  }

  protected expired(): boolean {
    const error = this.bookings.error();
    return error instanceof HttpErrorResponse && error.status === 401;
  }

  protected statusLabel(b: Booking): string {
    return b.status === 'CANCELLED'
      ? 'ยกเลิกแล้ว'
      : b.date < this.today
        ? 'ผ่านไปแล้ว'
        : 'ยืนยันแล้ว';
  }

  private startCountdown(seconds: number) {
    clearInterval(this.timer);
    this.resendIn.set(seconds);
    this.timer = setInterval(() => {
      this.resendIn.update((s) => Math.max(0, s - 1));
      if (this.resendIn() === 0) clearInterval(this.timer);
    }, 1000);
  }
}

function retryAfter(error: unknown): number | null {
  if (error instanceof HttpErrorResponse && error.status === 429) {
    const value = (error.error as { retryAfterSec?: number } | null)?.retryAfterSec;
    return typeof value === 'number' ? value : null;
  }
  return null;
}
