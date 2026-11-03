import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatPrice } from '../core/format';
import { CATEGORY_LABELS, Treatment } from '../core/models';
import { ImgFallback } from './img-fallback';
import { Icon } from './icon';

@Component({
  selector: 'app-treatment-card',
  imports: [RouterLink, Icon, ImgFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = treatment();
    <a class="card treatment-card" [routerLink]="['/treatments', t.slug]">
      <div class="photo-wrap">
        <img
          appImgFallback
          class="photo"
          [src]="t.imageUrl"
          [alt]="t.name"
          loading="lazy"
          width="421"
          height="188"
        />
        @if (t.badge) {
          <span class="chip badge">{{ t.badge }}</span>
        }
      </div>
      <div class="body">
        <span class="eyebrow">{{ categoryLabels[t.category] }}</span>
        <h3>{{ t.name }}</h3>
        <p class="summary">{{ t.summary }}</p>
        <div class="meta">
          <strong class="price">{{ price(t.priceThb) }}</strong>
          <span class="dot">·</span>
          <span class="duration"
            ><app-icon name="clock" [size]="14" /> {{ t.durationMin }} นาที</span
          >
        </div>
        <span class="more">ดูรายละเอียด <app-icon name="arrowUpRight" [size]="16" /></span>
      </div>
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    .treatment-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      text-decoration: none;
      transition:
        box-shadow 0.2s,
        transform 0.2s;
    }
    .treatment-card:hover {
      box-shadow: var(--shadow-card);
      transform: translateY(-2px);
    }
    .photo-wrap {
      position: relative;
    }
    .photo {
      width: 100%;
      height: 188px;
    }
    .badge {
      position: absolute;
      top: 12px;
      left: 12px;
    }
    .body {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 24px;
      gap: 8px;
    }
    h3 {
      font-size: 22px;
    }
    .summary {
      color: var(--color-text-muted);
      font-size: 14px;
      flex: 1;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
      font-size: 14px;
      color: var(--color-text-muted);
    }
    .price {
      font-size: 16px;
      color: var(--color-text-strong);
    }
    .duration {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .more {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border);
      color: var(--color-primary);
      font-weight: 600;
      font-size: 14px;
    }
  `,
})
export class TreatmentCard {
  readonly treatment = input.required<Treatment>();
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly price = formatPrice;
}
