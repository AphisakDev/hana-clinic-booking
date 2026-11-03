import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module.js';
import { BookingModule } from './booking/booking.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { CustomerModule } from './customer/customer.module.js';
import { usesInMemoryData } from './common/data-source.js';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ...(usesInMemoryData() ? [] : [PrismaModule]),
    CatalogModule,
    BookingModule,
    AdminModule,
    CustomerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
