import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { CATEGORY_LABELS, TreatmentCategory } from '../../core/models';
import { ImgFallback } from '../../shared/img-fallback';
import { Icon } from '../../shared/icon';
import { TreatmentCard } from '../../shared/treatment-card';

type CategoryFilter = TreatmentCategory | 'ALL';

@Component({
  selector: 'app-treatments-page',
  imports: [RouterLink, Icon, TreatmentCard, ImgFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './treatments-page.html',
  styleUrl: './treatments-page.css',
})
export class TreatmentsPage {
  private readonly api = inject(ApiService);

  protected readonly categories: { value: CategoryFilter; label: string }[] = [
    { value: 'ALL', label: 'ทั้งหมด' },
    ...(Object.entries(CATEGORY_LABELS) as [TreatmentCategory, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  protected readonly category = signal<CategoryFilter>('ALL');
  protected readonly searchText = signal('');

  /** Wait until the user stops typing before calling the API. */
  private readonly search = toSignal(
    toObservable(this.searchText).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ),
    { initialValue: '' },
  );

  protected readonly treatments = rxResource({
    params: () => ({ category: this.category(), q: this.search() }),
    stream: ({ params }) =>
      this.api.listTreatments({
        category: params.category === 'ALL' ? undefined : params.category,
        q: params.q,
      }),
  });

  protected readonly count = computed(() =>
    this.treatments.hasValue() ? this.treatments.value().length : 0,
  );
  protected readonly error = computed(() =>
    this.treatments.error() ? errorMessage(this.treatments.error()) : null,
  );

  protected selectCategory(value: CategoryFilter) {
    this.category.set(value);
  }

  protected onSearch(event: Event) {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected clearFilters() {
    this.category.set('ALL');
    this.searchText.set('');
  }
}
