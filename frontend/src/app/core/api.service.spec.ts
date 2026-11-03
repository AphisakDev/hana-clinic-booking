import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, ApiService, errorMessage } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test/api' },
      ],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends only the filters that are set', () => {
    api.listTreatments({ category: 'LASER', q: '  ' }).subscribe();
    const req = http.expectOne((r) => r.url === 'http://api.test/api/treatments');
    expect(req.request.params.get('category')).toBe('LASER');
    expect(req.request.params.has('q')).toBe(false);
    req.flush([]);
  });

  it('requests availability with all parameters', () => {
    api
      .getAvailability({
        treatment: 'hydrafacial',
        branch: 'siam',
        date: '2026-11-18',
        doctor: 'any',
      })
      .subscribe();
    const req = http.expectOne((r) => r.url === 'http://api.test/api/availability');
    expect(req.request.params.toString()).toBe(
      'treatment=hydrafacial&branch=siam&date=2026-11-18&doctor=any',
    );
    req.flush({ date: '2026-11-18', durationMin: 60, slots: [] });
  });

  it('cancels with PATCH', () => {
    api.cancelBooking('HNA-691118-AB12').subscribe();
    const req = http.expectOne('http://api.test/api/bookings/HNA-691118-AB12/cancel');
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});

describe('errorMessage', () => {
  it('uses the message sent by the API', () => {
    const error = new HttpErrorResponse({ status: 409, error: { message: 'คิวนี้เพิ่งถูกจองไป' } });
    expect(errorMessage(error)).toBe('คิวนี้เพิ่งถูกจองไป');
  });

  it('takes the first validation message', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['อีเมลไม่ถูกต้อง', 'x'] },
    });
    expect(errorMessage(error)).toBe('อีเมลไม่ถูกต้อง');
  });

  it('explains network failures', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain(
      'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
    );
  });
});
