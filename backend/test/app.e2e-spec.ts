import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { BookingRepository } from '../src/booking/booking.repository.js';
import { InMemoryBookingRepository } from '../src/booking/in-memory-booking.repository.js';
import { InMemoryTimeBlockRepository } from '../src/booking/in-memory-time-block.repository.js';
import { TimeBlockRepository } from '../src/booking/time-block.repository.js';
import { InMemoryStaffRepository } from '../src/admin/in-memory-staff.repository.js';
import { StaffRepository } from '../src/admin/staff.repository.js';
import { CatalogRepository } from '../src/catalog/catalog.repository.js';
import { InMemoryCatalogRepository } from '../src/catalog/in-memory-catalog.repository.js';
import { bangkokDateTime } from '../src/common/bangkok-time.js';
import { Clock, FixedClock } from '../src/common/clock.js';
import { configureApp } from '../src/configure-app.js';
import { SmsSender } from '../src/customer/sms-sender.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Runs the real HTTP stack (routing, validation, error mapping) with
 * in-memory repositories, so it needs no database.
 */
describe('Booking API (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterEach(async () => {
    await app.close();
  });

  const booking = {
    treatmentSlug: 'hydrafacial',
    branchSlug: 'siam',
    date: '2026-11-18',
    time: '11:00',
    customerName: '  มายด์ ศิริพร ',
    phone: '089-123-1840',
    email: 'mind@example.com',
  };

  it('GET /api/treatments?category=LASER', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/treatments?category=LASER')
      .expect(200);
    expect(res.body.map((t: { slug: string }) => t.slug)).toEqual([
      'laser-hair-removal',
    ]);
  });

  it('GET /api/treatments rejects an unknown category', () =>
    request(app.getHttpServer())
      .get('/api/treatments?category=SPA')
      .expect(400));

  it('books, looks up and cancels an appointment', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/bookings')
      .send(booking)
      .expect(201);
    expect(created.body.customerName).toBe('มายด์ ศิริพร');
    expect(created.body.phone).toBe('089-xxx-1840');

    const { reference } = created.body;
    await request(server).get(`/api/bookings/${reference}`).expect(200);

    const availability = await request(server)
      .get('/api/availability')
      .query({
        treatment: 'hydrafacial',
        branch: 'siam',
        date: '2026-11-18',
        doctor: created.body.doctor.slug,
      })
      .expect(200);
    expect(availability.body.slots[0]).toEqual({
      time: '11:00',
      available: false,
    });

    const cancelled = await request(server)
      .patch(`/api/bookings/${reference}/cancel`)
      .expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');
  });

  it('POST /api/bookings validates the body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/bookings')
      .send({ ...booking, phone: '123', email: 'not-an-email', extra: true })
      .expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining(['เบอร์โทรไม่ถูกต้อง', 'อีเมลไม่ถูกต้อง']),
    );
  });

  it('GET /api/bookings/:reference returns 404 when missing', () =>
    request(app.getHttpServer())
      .get('/api/bookings/HNA-000000-XXXX')
      .expect(404));
});
