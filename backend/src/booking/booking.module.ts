import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { Clock, SystemClock } from '../common/clock.js';
import { usesInMemoryData } from '../common/data-source.js';
import { BookingController } from './booking.controller.js';
import { BookingRepository } from './booking.repository.js';
import { BookingService } from './booking.service.js';
import { InMemoryBookingRepository } from './in-memory-booking.repository.js';
import { PrismaBookingRepository } from './prisma-booking.repository.js';
import { InMemoryTimeBlockRepository } from './in-memory-time-block.repository.js';
import { PrismaTimeBlockRepository } from './prisma-time-block.repository.js';
import { SlotCalculator } from './slot-calculator.js';
import { TimeBlockRepository } from './time-block.repository.js';

@Module({
  imports: [CatalogModule],
  controllers: [BookingController],
  providers: [
    BookingService,
    SlotCalculator,
    {
      provide: BookingRepository,
      useClass: usesInMemoryData()
        ? InMemoryBookingRepository
        : PrismaBookingRepository,
    },
    {
      provide: TimeBlockRepository,
      useClass: usesInMemoryData()
        ? InMemoryTimeBlockRepository
        : PrismaTimeBlockRepository,
    },
    { provide: Clock, useClass: SystemClock },
  ],
  exports: [BookingService, BookingRepository, TimeBlockRepository, Clock],
})
export class BookingModule {}
