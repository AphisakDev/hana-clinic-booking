import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api.service';
import { formatPrice } from '../../core/format';
import { CATEGORY_LABELS } from '../../core/models';
import { ImgFallback } from '../../shared/img-fallback';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-treatment-detail-page',
  imports: [RouterLink, Icon, ImgFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './treatment-detail-page.html',
  styleUrl: './treatment-detail-page.css',
})
export class TreatmentDetailPage {
  private readonly api = inject(ApiService);

  /** Bound from the `:slug` route parameter. */
  readonly slug = input.required<string>();

  protected readonly treatment = rxResource({
    params: () => this.slug(),
    stream: ({ params }) => this.api.getTreatment(params),
  });

  /** Doctors from every branch: shown as "who may treat you". */
  protected readonly doctors = rxResource({ stream: () => this.api.listDoctors() });

  protected readonly notFound = computed(() => {
    const error = this.treatment.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly error = computed(() =>
    this.treatment.error() && !this.notFound() ? errorMessage(this.treatment.error()) : null,
  );

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly price = formatPrice;
  protected readonly stepNumber = (i: number) => String(i + 1).padStart(2, '0');
}
