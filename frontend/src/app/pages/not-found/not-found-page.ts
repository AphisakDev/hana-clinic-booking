import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <div class="state-box">
        <h1>ไม่พบหน้านี้</h1>
        <p>ลิงก์อาจไม่ถูกต้องหรือถูกย้ายไปแล้ว</p>
        <a class="btn btn-primary" routerLink="/">กลับหน้าทรีตเมนต์</a>
      </div>
    </div>
  `,
  styles: `
    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-top: 64px;
    }
  `,
})
export class NotFoundPage {}
