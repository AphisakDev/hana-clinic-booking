import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Treatment } from '../../core/models';
import { TreatmentsPage } from './treatments-page';

const sample = (slug: string, name: string): Treatment => ({
  id: slug,
  slug,
  name,
  category: 'SKIN',
  badge: '',
  summary: 'สรุป',
  description: '',
  highlight: '',
  priceThb: 1990,
  durationMin: 60,
  imageUrl: '',
  popular: false,
  steps: [],
  prepTips: [],
  aftercare: '',
  sortOrder: 0,
});

describe('TreatmentsPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TreatmentsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('shows the treatments returned by the API', async () => {
    const fixture = TestBed.createComponent(TreatmentsPage);
    fixture.detectChanges();
    TestBed.tick(); // run the resource so it sends its request

    http
      .expectOne((r) => r.url === '/api/treatments')
      .flush([sample('hydrafacial', 'HydraFacial ผิวฉ่ำใส'), sample('meso', 'เมโสหน้าใส')]);
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('app-treatment-card').length).toBe(2);
    expect(el.textContent).toContain('2 รายการ');
    expect(el.textContent).toContain('฿1,990');
  });

  it('asks the API again when a category is chosen', async () => {
    const fixture = TestBed.createComponent(TreatmentsPage);
    fixture.detectChanges();
    TestBed.tick(); // run the resource so it sends its request
    http.expectOne((r) => r.url === '/api/treatments').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const laser = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('.filter-chip'),
    ).find((b) => b.textContent?.trim() === 'เลเซอร์')!;
    laser.click();
    fixture.detectChanges();
    TestBed.tick();

    const req = http.expectOne((r) => r.url === '/api/treatments');
    expect(req.request.params.get('category')).toBe('LASER');
    req.flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ไม่พบทรีตเมนต์');
  });
});
