import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from '../../booking/booking.types.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleQuery {
  @Matches(DATE, { message: 'date ต้องเป็นรูปแบบ YYYY-MM-DD' })
  date: string;

  @IsString()
  @IsNotEmpty()
  branch: string;
}

export class StatsQuery {
  @IsOptional()
  @IsString()
  branch?: string;
}

export class ChangeStatusDto {
  @IsIn(BOOKING_STATUSES)
  status: BookingStatus;
}

export class CreateBlockDto {
  @IsString()
  @IsNotEmpty()
  doctorSlug: string;

  @Matches(DATE, { message: 'date ต้องเป็นรูปแบบ YYYY-MM-DD' })
  date: string;

  @Matches(TIME, { message: 'startTime ต้องเป็นรูปแบบ HH:mm' })
  startTime: string;

  @Matches(TIME, { message: 'endTime ต้องเป็นรูปแบบ HH:mm' })
  endTime: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุเหตุผล' })
  @MaxLength(100)
  reason: string;
}
