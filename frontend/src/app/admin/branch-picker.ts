import { ChangeDetectionStrategy, Component, effect, inject, model } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ApiService } from '../core/api.service';

/** Segmented control to switch branch; selects the first branch when empty. */
@Component({
  selector: 'app-branch-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="radiogroup" aria-label="สาขา">
      @for (b of branches.value() ?? []; track b.id) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="value() === b.slug"
          [class.on]="value() === b.slug"
          (click)="value.set(b.slug)"
        >
          {{ b.name.replace('สาขา', '') }}
        </button>
      }
    </div>
  `,
  styles: `
    .seg {
      display: inline-flex;
      padding: 4px;
      border-radius: var(--radius-pill);
      background: var(--color-surface-subtle);
    }
    button {
      padding: 8px 16px;
      border: 0;
      border-radius: var(--radius-pill);
      background: transparent;
      color: var(--color-text-muted);
      font-size: 14px;
      cursor: pointer;
    }
    button.on {
      background: var(--color-surface);
      color: var(--color-primary);
      font-weight: 600;
      box-shadow: 0 1px 2px rgb(74 47 39 / 10%);
    }
  `,
})
export class BranchPicker {
  private readonly api = inject(ApiService);

  readonly value = model('');
  protected readonly branches = rxResource({ stream: () => this.api.listBranches() });

  constructor() {
    // Default to the first branch once the list arrives.
    effect(() => {
      const first = this.branches.value()?.[0];
      if (first && !this.value()) this.value.set(first.slug);
    });
  }
}
