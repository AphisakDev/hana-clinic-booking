import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/api.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-doctors-page',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <header class="head">
        <span class="eyebrow">ทีมแพทย์</span>
        <h1>ดูแลโดยแพทย์ผู้เชี่ยวชาญ</h1>
        <p class="muted">
          ให้คำปรึกษาตรงไปตรงมา ไม่แนะนำเกินจำเป็น (รายชื่อแพทย์ในโปรเจกต์นี้เป็นชื่อสมมติ)
        </p>
      </header>

      @if (doctors.error()) {
        <div class="error-banner" role="alert">
          <app-icon name="alert" /> โหลดรายชื่อแพทย์ไม่สำเร็จ
          <button type="button" class="link-action" (click)="doctors.reload()">ลองใหม่</button>
        </div>
      }

      @for (group of groups(); track group.branch.id) {
        <section class="branch">
          <h2><app-icon name="mapPin" [size]="20" /> {{ group.branch.name }}</h2>
          <p class="muted small">
            {{ group.branch.transit }} · เปิด {{ group.branch.openTime }}–{{
              group.branch.closeTime
            }}
            น.
          </p>
          <div class="grid">
            @for (d of group.doctors; track d.id) {
              <article class="card doctor">
                <span class="avatar" aria-hidden="true">{{ d.name.split(' ')[1]?.charAt(0) }}</span>
                <div>
                  <h3>{{ d.name }}</h3>
                  <p class="muted small">{{ d.title }} · ประสบการณ์ {{ d.experienceYears }} ปี</p>
                  <p class="bio">{{ d.bio }}</p>
                </div>
              </article>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .head {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 46px 0 12px;
    }
    .head h1 {
      font-size: 40px;
    }
    .branch {
      margin-top: 36px;
    }
    .branch h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
    }
    .branch h2 app-icon {
      color: var(--color-primary);
    }
    .small {
      font-size: 13px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      margin-top: 18px;
    }
    .doctor {
      display: flex;
      gap: 18px;
      padding: 24px;
    }
    .doctor h3 {
      font-size: 20px;
    }
    .bio {
      margin-top: 10px;
      font-size: 14px;
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--color-surface-tint);
      color: var(--color-primary);
      font-family: var(--font-heading);
      font-size: 24px;
    }
    @media (max-width: 720px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .head h1 {
        font-size: 30px;
      }
    }
  `,
})
export class DoctorsPage {
  private readonly api = inject(ApiService);
  protected readonly branches = rxResource({ stream: () => this.api.listBranches() });
  protected readonly doctors = rxResource({ stream: () => this.api.listDoctors() });

  protected readonly groups = computed(() => {
    if (!this.branches.hasValue() || !this.doctors.hasValue()) return [];
    const doctors = this.doctors.value();
    return this.branches.value().map((branch) => ({
      branch,
      doctors: doctors.filter((d) => d.branchId === branch.id),
    }));
  });
}
