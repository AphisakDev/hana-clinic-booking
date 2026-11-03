import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api.service';
import { formatBangkokDateTime, formatPrice, formatThaiDate } from '../../core/format';
import { ImgFallback } from '../../shared/img-fallback';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-booking-confirmed-page',
  imports: [RouterLink, Icon, ImgFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-confirmed-page.html',
  styleUrl: './booking-confirmed-page.css',
})
export class BookingConfirmedPage {
  private readonly api = inject(ApiService);

  readonly reference = input.required<string>();

  /** True right after the booking form redirects here. */
  protected readonly justBooked = !!(
    inject(Router).currentNavigation()?.extras.state?.['justBooked'] ?? history.state?.justBooked
  );

  protected readonly booking = rxResource({
    params: () => this.reference(),
    stream: ({ params }) => this.api.getBooking(params),
  });

  protected readonly notFound = computed(() => {
    const error = this.booking.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly confirmingCancel = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly cancelError = signal<string | null>(null);

  protected readonly price = formatPrice;
  protected readonly thaiDate = formatThaiDate;
  protected readonly bangkokDateTime = formatBangkokDateTime;

  protected cancel() {
    this.cancelling.set(true);
    this.cancelError.set(null);
    this.api.cancelBooking(this.reference()).subscribe({
      next: (updated) => {
        this.booking.set(updated);
        this.cancelling.set(false);
        this.confirmingCancel.set(false);
      },
      error: (error: unknown) => {
        this.cancelling.set(false);
        this.cancelError.set(errorMessage(error));
      },
    });
  }
}
