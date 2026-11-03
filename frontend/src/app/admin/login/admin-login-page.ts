import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api.service';
import { Icon } from '../../shared/icon';
import { Logo } from '../../shared/logo';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [ReactiveFormsModule, RouterLink, Icon, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <form class="card box" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <a routerLink="/" class="brand">
          <app-logo subtitle="STAFF" [size]="30" />
        </a>
        <h1>เข้าสู่ระบบพนักงาน</h1>

        @if (reason() === 'expired') {
          <p class="notice">เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง</p>
        }

        <label class="field">
          <span>อีเมล</span>
          <input formControlName="email" type="email" autocomplete="username" />
        </label>
        <label class="field">
          <span>รหัสผ่าน</span>
          <input formControlName="password" type="password" autocomplete="current-password" />
        </label>

        @if (error(); as message) {
          <div class="error-banner" role="alert"><app-icon name="alert" /> {{ message }}</div>
        }

        <button
          type="submit"
          class="btn btn-primary btn-block"
          [disabled]="form.invalid || loading()"
        >
          {{ loading() ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ' }}
        </button>

        <p class="demo muted">
          บัญชีเดโม: <code>admin&#64;hana.test</code> / <code>hana1234</code>
          <button type="button" class="link-action" (click)="fillDemo()">กรอกให้</button>
        </p>
      </form>
    </div>
  `,
  styles: `
    .wrap {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
      background: var(--color-surface-tint);
    }
    .box {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      max-width: 400px;
      padding: 36px;
      box-shadow: var(--shadow-card);
    }
    .brand {
      display: flex;
      align-items: baseline;
      gap: 10px;
      text-decoration: none;
    }
    h1 {
      font-size: 24px;
    }
    .notice {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: var(--color-surface-subtle);
      font-size: 14px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-strong);
    }
    .field input {
      height: 46px;
      padding: 0 14px;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-sm);
      font-size: 15px;
    }
    .field input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgb(158 90 76 / 15%);
    }
    .demo {
      font-size: 13px;
    }
    code {
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--color-surface-subtle);
      font-size: 12px;
    }
  `,
})
export class AdminLoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** `?reason=expired` after the API rejected an old token. */
  readonly reason = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected fillDemo() {
    this.form.setValue({ email: 'admin@hana.test', password: 'hana1234' });
  }

  protected submit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigate(['/admin']),
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
