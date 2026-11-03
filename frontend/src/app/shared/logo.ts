import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * HANA (花, "flower") brand mark: five soft petals around a cocoa centre.
 * An original mark for this fictional clinic.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'logo' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="var(--color-accent-pink)">
        @for (angle of petals; track angle) {
          <ellipse
            cx="16"
            cy="8.6"
            rx="5"
            ry="7"
            [attr.transform]="'rotate(' + angle + ' 16 16)'"
          />
        }
      </g>
      <circle cx="16" cy="16" r="3.6" fill="var(--color-primary)" />
    </svg>
    <span class="text">
      <span class="name">HANA</span>
      @if (subtitle()) {
        <span class="sub">{{ subtitle() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      line-height: 1.1;
    }
    .text {
      display: flex;
      flex-direction: column;
    }
    .name {
      font-family: var(--font-heading);
      font-weight: 500;
      font-size: 24px;
      letter-spacing: 0.12em;
      color: var(--color-text-strong);
    }
    .sub {
      font-size: 9px;
      letter-spacing: 0.22em;
      color: var(--color-primary);
    }
  `,
})
export class Logo {
  readonly size = input(34);
  readonly subtitle = input('CLINIC');
  protected readonly petals = [0, 72, 144, 216, 288];
}
