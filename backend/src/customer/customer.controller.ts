import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from '../booking/booking.service.js';
import { CustomerAuthService } from './customer-auth.service.js';
import { CustomerGuard, type CustomerRequest } from './customer.guard.js';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto.js';

@Controller('customer')
export class CustomerController {
  constructor(
    private readonly auth: CustomerAuthService,
    private readonly bookings: BookingService,
  ) {}

  @Post('otp/request')
  @HttpCode(200)
  requestCode(@Body() dto: RequestOtpDto) {
    return this.auth.requestCode(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(200)
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verify(dto.phone, dto.code);
  }

  @Get('bookings')
  @UseGuards(CustomerGuard)
  myBookings(@Req() req: CustomerRequest) {
    return this.bookings.findByPhone(req.customer!.phone);
  }
}
