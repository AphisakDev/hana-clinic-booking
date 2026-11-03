import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyBookingsPage } from './my-bookings-page';

describe('MyBookingsPage (phone + OTP)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [MyBookingsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const typeInto = async (
    fixture: { whenStable(): Promise<unknown> },
    el: HTMLElement,
    selector: string,
    value: string,
  ) => {
    await fixture.whenStable();
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('sends a code, verifies it and shows the bookings', async () => {
    const fixture = TestBed.createComponent(MyBookingsPage);
    const el: HTMLElement = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();

    await typeInto(fixture, el, '#phone', '089-123-1840');
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/customer/otp/request');
    expect(request.request.body).toEqual({ phone: '0891231840' });
    request.flush({ expiresInSec: 300, resendInSec: 60, demoCode: '123456' });
    fixture.detectChanges();
    expect(el.textContent).toContain('089-123-1840');
    expect(el.textContent).toContain('123456'); // demo hint
    expect(el.textContent).toContain('ขอรหัสใหม่ได้ใน 60 วินาที');

    // Typing the 6th digit submits on its own.
    await typeInto(fixture, el, '#otp', '123456');
    fixture.detectChanges();
    const verify = http.expectOne('/api/customer/otp/verify');
    expect(verify.request.body).toEqual({ phone: '0891231840', code: '123456' });
    verify.flush({ accessToken: 'customer-jwt' });

    fixture.detectChanges();
    TestBed.tick();
    const list = http.expectOne('/api/customer/bookings');
    expect(list.request.headers.get('Authorization')).toBe('Bearer customer-jwt');
    list.flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('ยังไม่มีนัดหมายของเบอร์นี้');
  });

  it('shows the API message for a wrong code and clears the input', async () => {
    const fixture = TestBed.createComponent(MyBookingsPage);
    const el: HTMLElement = fixture.nativeElement;
    fixture.detectChanges();

    await typeInto(fixture, el, '#phone', '0891231840');
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/customer/otp/request').flush({ expiresInSec: 300, resendInSec: 60 });
    fixture.detectChanges();

    await typeInto(fixture, el, '#otp', '000000');
    fixture.detectChanges();
    http
      .expectOne('/api/customer/otp/verify')
      .flush(
        { message: 'รหัสไม่ถูกต้อง เหลืออีก 4 ครั้ง' },
        { status: 401, statusText: 'Unauthorized' },
      );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.textContent).toContain('รหัสไม่ถูกต้อง เหลืออีก 4 ครั้ง');
    expect(el.querySelector<HTMLInputElement>('#otp')!.value).toBe('');
  });
});
