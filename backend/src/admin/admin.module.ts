import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BookingModule } from '../booking/booking.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { usesInMemoryData } from '../common/data-source.js';
import { jwtSecret } from '../common/jwt-config.js';
import { AdminAuthController, AdminController } from './admin.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';
import { AuthService } from './auth.service.js';
import { DemoDataSeeder } from './demo-data.seeder.js';
import { InMemoryStaffRepository } from './in-memory-staff.repository.js';
import { PrismaStaffRepository } from './prisma-staff.repository.js';
import { StaffRepository } from './staff.repository.js';

@Module({
  imports: [
    CatalogModule,
    BookingModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret(),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminController],
  providers: [
    AdminService,
    AuthService,
    AdminGuard,
    {
      provide: StaffRepository,
      useClass: usesInMemoryData()
        ? InMemoryStaffRepository
        : PrismaStaffRepository,
    },
    ...(usesInMemoryData() ? [DemoDataSeeder] : []),
  ],
})
export class AdminModule {}
