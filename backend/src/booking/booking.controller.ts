import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { AvailabilityQuery } from './dto/availability.query.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Controller()
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  @Get('availability')
  availability(@Query() query: AvailabilityQuery) {
    return this.bookings.getAvailability({
      treatmentSlug: query.treatment,
      branchSlug: query.branch,
      date: query.date,
      doctorSlug: query.doctor,
    });
  }

  @Post('bookings')
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  @Get('bookings/:reference')
  find(@Param('reference') reference: string) {
    return this.bookings.findByReference(reference);
  }

  @Patch('bookings/:reference/cancel')
  @HttpCode(200)
  cancel(@Param('reference') reference: string) {
    return this.bookings.cancel(reference);
  }
}
