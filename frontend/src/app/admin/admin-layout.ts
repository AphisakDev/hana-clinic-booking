import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon } from '../shared/icon';
import { Logo } from '../shared/logo';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a routerLink="/admin" class="brand">
          <app-logo subtitle="STAFF" [size]="30" />
        </a>
        <nav aria-label="เมนูพนักงาน">
          <a
            routerLink="/admin"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <app-icon name="sparkles" /> ภาพรวม
          </a>
          <a routerLink="/admin/schedule" routerLinkActive="active">
            <app-icon name="calendar" /> ตารางนัด
          </a>
          <a routerLink="/" target="_blank">
            <app-icon name="arrowUpRight" /> เปิดหน้าเว็บลูกค้า
          </a>
        </nav>
        <div class="me">
          <span class="avatar" aria-hidden="true">{{ auth.staff()?.name?.charAt(0) }}</span>
          <div class="who">
            <strong>{{ auth.staff()?.name }}</strong>
            <span class="muted">{{ auth.staff()?.email }}</span>
          </div>
          <button type="button" class="link-action" (click)="auth.logout()">ออกจากระบบ</button>
        </div>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
    }
    .sidebar {
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      gap: 28px;
      height: 100vh;
      padding: 28px 18px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
    }
    .brand {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 0 10px;
      text-decoration: none;
    }
    nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      font-size: 14px;
      text-decoration: none;
    }
    nav a:hover {
      background: var(--color-surface-subtle);
      color: var(--color-text-strong);
    }
    nav a.active {
      background: var(--color-surface-tint);
      color: var(--color-primary);
      font-weight: 600;
    }
    .me {
      display: grid;
      grid-template-columns: 36px 1fr;
      gap: 4px 10px;
      margin-top: auto;
      padding: 14px 10px 0;
      border-top: 1px solid var(--color-border);
      font-size: 13px;
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-surface-tint);
      color: var(--color-primary);
      font-family: var(--font-heading);
    }
    .who {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .who span {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
    }
    .me .link-action {
      grid-column: 2;
      font-size: 13px;
    }
    .content {
      min-width: 0;
      padding: 32px 40px 48px;
      background: var(--color-bg);
    }
    @media (max-width: 860px) {
      .shell {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: static;
        height: auto;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-right: 0;
        border-bottom: 1px solid var(--color-border);
      }
      nav {
        flex-direction: row;
        overflow-x: auto;
      }
      .me {
        display: flex;
        margin: 0 0 0 auto;
        padding: 0;
        border: 0;
      }
      .avatar,
      .who {
        display: none;
      }
      .content {
        padding: 20px 16px 40px;
      }
    }
  `,
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
}
