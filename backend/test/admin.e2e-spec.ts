import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { InMemoryStaffRepository } from '../src/admin/in-memory-staff.repository.js';
import { StaffRepository } from '../src/admin/staff.repository.js';
import { AppModule } from '../src/app.module.js';
import { BookingRepository } from '../src/booking/booking.repository.js';
import { InMemoryBookingRepository } from '../src/booking/in-memory-booking.repository.js';
import { InMemoryTimeBlockRepository } from '../src/booking/in-memory-time-block.repository.js';
import { TimeBlockRepository } from '../src/booking/time-block.repository.js';
import { CatalogRepository } from '../src/catalog/catalog.repository.js';
import { InMemoryCatalogRepository } from '../src/catalog/in-memory-catalog.repository.js';
import { bangkokDateTime } from '../src/common/bangkok-time.js';
import { Clock, FixedClock } from '../src/common/clock.js';
import { configureApp } from '../src/configure-app.js';
import { SmsSender } from '../src/customer/sms-sender.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Admin API (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(CatalogRepository)
      .useValue(new InMemoryCatalogRepository())
      .overrideProvider(BookingRepository)
      .useValue(new InMemoryBookingRepository())
      .overrideProvider(TimeBlockRepository)
      .useValue(new InMemoryTimeBlockRepository())
      .overrideProvider(StaffRepository)
      .useValue(new InMemoryStaffRepository())
      .overrideProvider(SmsSender)
      .useValue({ send: async () => undefined })
      .overrideProvider(Clock)
      .useValue(new FixedClock(bangkokDateTime('2026-11-10', '09:00')))
      .compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    http = request(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  const login = async () => {
    const res = await http
      .post('/api/admin/login')
      .send({ email: 'admin@hana.test', password: 'hana1234' })
      .expect(200);
    return `Bearer ${res.body.accessToken as string}`;
  };

  it('rejects a wrong password with a generic message', async () => {
    const res = await http
      .post('/api/admin/login')
      .send({ email: 'admin@hana.test', password: 'nope' })
      .expect(401);
    expect(res.body.message).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  });

  it('protects admin routes', async () => {
    await http
      .get('/api/admin/schedule?date=2026-11-18&branch=siam')
      .expect(401);
    await http
      .get('/api/admin/schedule?date=2026-11-18&branch=siam')
      .set('Authorization', 'Bearer not-a-token')
      .expect(401);
  });

  it('lets staff see a booking, check the client in and block time', async () => {
    const auth = await login();
    const me = await http
      .get('/api/admin/me')
      .set('Authorization', auth)
      .expect(200);
    expect(me.body).toMatchObject({
      email: 'admin@hana.test',
      role: 'ADMIN',
    });

    const created = await http
      .post('/api/bookings')
      .send({
        treatmentSlug: 'hydrafacial',
        branchSlug: 'siam',
        doctorSlug: 'napatsorn',
        date: '2026-11-18',
        time: '11:00',
        customerName: 'มายด์',
        phone: '0891231840',
        email: 'mind@example.com',
      })
      .expect(201);

    const schedule = await http
      .get('/api/admin/schedule?date=2026-11-18&branch=siam')
      .set('Authorization', auth)
      .expect(200);
    expect(schedule.body.summary.total).toBe(1);

    await http
      .patch(`/api/admin/bookings/${created.body.reference}/status`)
      .set('Authorization', auth)
      .send({ status: 'CHECKED_IN' })
      .expect(200);

    await http
      .post('/api/admin/blocks')
      .set('Authorization', auth)
      .send({
        doctorSlug: 'thanakorn',
        date: '2026-11-18',
        startTime: '11:00',
        endTime: '20:00',
        reason: 'ลาพักร้อน',
      })
      .expect(201);

    // Both doctors are now busy at 11:00, so clients can no longer pick it.
    const availability = await http
      .get(
        '/api/availability?treatment=hydrafacial&branch=siam&date=2026-11-18',
      )
      .expect(200);
    const at11 = availability.body.slots.find(
      (s: { time: string }) => s.time === '11:00',
    );
    expect(at11.available).toBe(false);
  });

  it('validates the status value', async () => {
    const auth = await login();
    await http
      .patch('/api/admin/bookings/HNA-691118-AAAA/status')
      .set('Authorization', auth)
      .send({ status: 'DONE' })
      .expect(400);
  });
});
