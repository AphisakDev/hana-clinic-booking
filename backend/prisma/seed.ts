import { PrismaClient } from '@prisma/client';
import { DEMO_BOOKINGS } from '../src/admin/demo-bookings.js';
import { DEMO_STAFF } from '../src/admin/demo-staff.js';
import { hashPassword } from '../src/admin/password.js';
import { generateBookingReference } from '../src/booking/booking-reference.js';
import {
  BRANCHES,
  DOCTORS,
  TREATMENTS,
} from '../src/catalog/catalog.data.js';
import {
  addMinutes,
  bangkokDateTime,
  toBangkokDate,
} from '../src/common/bangkok-time.js';

const prisma = new PrismaClient();

async function main() {
  for (const branch of BRANCHES) {
    await prisma.branch.upsert({
      where: { slug: branch.slug },
      update: branch,
      create: branch,
    });
  }
  for (const doctor of DOCTORS) {
    await prisma.doctor.upsert({
      where: { slug: doctor.slug },
      update: doctor,
      create: doctor,
    });
  }
  for (const { steps, prepTips, ...treatment } of TREATMENTS) {
    const data = {
      ...treatment,
      steps: steps as object[],
      prepTips: prepTips as string[],
    };
    await prisma.treatment.upsert({
      where: { slug: treatment.slug },
      update: data,
      create: data,
    });
  }
  for (const { password, ...account } of DEMO_STAFF) {
    await prisma.staff.upsert({
      where: { email: account.email },
      update: {},
      create: { ...account, passwordHash: await hashPassword(password) },
    });
  }

  // Sample appointments around today, only into an empty table.
  let bookings = 0;
  if ((await prisma.booking.count()) === 0) {
    const today = toBangkokDate(new Date());
    const todayStart = bangkokDateTime(today, '00:00');
    for (const demo of DEMO_BOOKINGS) {
      const treatment = TREATMENTS.find((t) => t.slug === demo.treatmentSlug)!;
      const date = toBangkokDate(addMinutes(todayStart, demo.dayOffset * 1440));
      const startAt = bangkokDateTime(date, demo.time);
      await prisma.booking.create({
        data: {
          reference: generateBookingReference(startAt),
          status: demo.status,
          statusAt: demo.status === 'CONFIRMED' ? null : startAt,
          startAt,
          endAt: addMinutes(startAt, treatment.durationMin),
          customerName: demo.customerName,
          phone: demo.phone,
          email: 'demo@example.com',
          treatmentId: treatment.id,
          branchId: BRANCHES.find((b) => b.slug === demo.branchSlug)!.id,
          doctorId: DOCTORS.find((d) => d.slug === demo.doctorSlug)!.id,
        },
      });
      bookings++;
    }
  }

  console.log(
    `Seeded ${BRANCHES.length} branches, ${DOCTORS.length} doctors, ${TREATMENTS.length} treatments, ` +
      `${DEMO_STAFF.length} staff, ${bookings} demo bookings`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
