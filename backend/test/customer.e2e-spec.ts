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

describe('Customer OTP API (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  const sms: { phone: string; message: string }[] = [];

  beforeEach(async () => {
    process.env.OTP_SHOW_CODE = 'true';
    sms.length = 0;
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
      .useValue({
        send: async (phone: string, message: string) =>
          void sms.push({ phone, message }),
      })
      .overrideProvider(Clock)
      .useValue(new FixedClock(bangkokDateTime('2026-11-10', '09:00')))
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    http = request(app.getHttpServer());
  });

  afterEach(async () => {
    delete process.env.OTP_SHOW_CODE;
    await app.close();
  });

  const book = (phone: string, time: string) =>
    http
      .post('/api/bookings')
      .send({
        treatmentSlug: 'hydrafacial',
        branchSlug: 'siam',
        date: '2026-11-18',
        time,
        customerName: 'มายด์',
        phone,
        email: 'mind@example.com',
      })
      .expect(201);

  it("verifies the phone, then lists only that phone's bookings", async () => {
    await book('089-123-1840', '11:00');
    await book('0891231840', '14:00');
    await book('0812345678', '15:00');

    const sent = await http
      .post('/api/customer/otp/request')
      .send({ phone: '089-123-1840' })
      .expect(200);
    expect(sent.body).toMatchObject({ expiresInSec: 300, resendInSec: 60 });
    expect(sms[0].message).toContain(sent.body.demoCode);

    const verified = await http
      .post('/api/customer/otp/verify')
      .send({ phone: '0891231840', code: sent.body.demoCode })
      .expect(200);

    const list = await http
      .get('/api/customer/bookings')
      .set('Authorization', `Bearer ${verified.body.accessToken}`)
      .expect(200);
    expect(list.body.map((b: { startTime: string }) => b.startTime)).toEqual([
      '14:00',
      '11:00',
    ]);
  });

  it('rejects a wrong code and says how many tries are left', async () => {
    const sent = await http
      .post('/api/customer/otp/request')
      .send({ phone: '0891231840' })
      .expect(200);
    const wrong = sent.body.demoCode === '000000' ? '111111' : '000000';
    const res = await http
      .post('/api/customer/otp/verify')
      .send({ phone: '0891231840', code: wrong })
      .expect(401);
    expect(res.body.message).toBe('รหัสไม่ถูกต้อง เหลืออีก 4 ครั้ง');
  });

  it('rate-limits code requests', async () => {
    await http
      .post('/api/customer/otp/request')
      .send({ phone: '0891231840' })
      .expect(200);
    const res = await http
      .post('/api/customer/otp/request')
      .send({ phone: '0891231840' })
      .expect(429);
    expect(res.body.retryAfterSec).toBeGreaterThan(0);
  });

  it('keeps customer and staff tokens apart', async () => {
    const sent = await http
      .post('/api/customer/otp/request')
      .send({ phone: '0891231840' });
    const { body } = await http
      .post('/api/customer/otp/verify')
      .send({ phone: '0891231840', code: sent.body.demoCode });
    await http
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(401);

    const staff = await http
      .post('/api/admin/login')
      .send({ email: 'admin@hana.test', password: 'hana1234' });
    await http
      .get('/api/customer/bookings')
      .set('Authorization', `Bearer ${staff.body.accessToken}`)
      .expect(401);
    await http.get('/api/customer/bookings').expect(401);
  });
});
