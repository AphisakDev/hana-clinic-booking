# Clinic Booking API (NestJS)

REST API for the HANA-style clinic booking concept. See the [root README](../README.md) for the full project.

## Run

```bash
npm install
npm run start:demo          # no database: in-memory sample data on :3000
```

With PostgreSQL (from the repo root: `docker compose up -d`):

```bash
cp .env.example .env
npm run db:migrate          # create tables
npm run db:seed             # sample branches, doctors, treatments
npm run start:dev
```

## Endpoints (prefix `/api`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/treatments?category=SKIN&q=เลเซอร์` | list / filter / search |
| GET | `/treatments/:slug` | treatment detail |
| GET | `/branches` | branches |
| GET | `/doctors?branch=siam` | doctors (optionally by branch) |
| GET | `/availability?treatment=&branch=&date=YYYY-MM-DD&doctor=` | time slots for a day |
| POST | `/bookings` | create a booking |
| GET | `/bookings/:reference` | booking detail (phone/email masked) |
| PATCH | `/bookings/:reference/cancel` | cancel (up to 24 h before) |
| POST | `/customer/otp/request` | `{ phone }` → send a 6-digit code (429 when rate-limited) |
| POST | `/customer/otp/verify` | `{ phone, code }` → `{ accessToken }` for 30 min |
| GET | `/customer/bookings` | bookings of the verified phone 🔑 |
| POST | `/admin/login` | staff login → `{ accessToken, staff }` |
| GET | `/admin/me` | current staff 🔒 |
| GET | `/admin/stats?branch=` | dashboard numbers 🔒 |
| GET | `/admin/schedule?date=&branch=` | day schedule per doctor 🔒 |
| PATCH | `/admin/bookings/:reference/status` | `{ status }` check-in / completed / no-show / cancel 🔒 |
| POST | `/admin/blocks` | block a doctor's time 🔒 |
| DELETE | `/admin/blocks/:id` | remove a block 🔒 |

🔑 needs a customer token, 🔒 needs `Authorization: Bearer <accessToken>`. Demo account: `admin@hana.test` / `hana1234`.

## Design

```
controller  →  service (business rules)  →  repository (abstract class)
                                              ├─ PrismaXRepository   (PostgreSQL)
                                              └─ InMemoryXRepository (tests, demo)
```

- `SlotCalculator` is a pure class: opening hours + treatment length + busy periods → slots. Easy to unit test.
- `BookingService` owns the rules: no past dates, max 60 days ahead, doctor must belong to the branch, pick the first free doctor when "any".
- Double booking is prevented twice: the service only offers free slots, and the Prisma repository re-checks inside a `SERIALIZABLE` transaction so two people racing for the same slot cannot both win.
- `Clock` is injected, so tests can freeze "now".
- Admin: JWT (`@nestjs/jwt`) + `AdminGuard`; passwords hashed with Node's built-in scrypt. Status changes follow the table in `admin/status-rules.ts`. Doctor time blocks are stored by `TimeBlockRepository` and count as busy time when slots are calculated.
- All times are stored in UTC and shown in Asia/Bangkok.

## Tests

```bash
npm test            # unit tests (slot calculator, booking rules, catalog)
npm run test:e2e    # HTTP layer with in-memory repositories, no DB needed
```
