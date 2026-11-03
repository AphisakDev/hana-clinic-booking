import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BookingModule } from '../booking/booking.module.js';
import { CustomerAuthService } from './customer-auth.service.js';
import { CustomerController } from './customer.controller.js';
import { CustomerGuard } from './customer.guard.js';
import { OtpService } from './otp.service.js';
import { LogSmsSender, SmsSender } from './sms-sender.js';

@Module({
  // The customer secret is passed per call, so no default secret here.
  imports: [BookingModule, JwtModule.register({})],
  controllers: [CustomerController],
  providers: [
    OtpService,
    CustomerAuthService,
    CustomerGuard,
    { provide: SmsSender, useClass: LogSmsSender },
  ],
})
export class CustomerModule {}
