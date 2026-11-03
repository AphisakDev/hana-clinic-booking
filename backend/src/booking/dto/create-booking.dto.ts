import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  treatmentSlug: string;

  @IsString()
  @IsNotEmpty()
  branchSlug: string;

  /** Omit (or send "any") to get the first available doctor. */
  @IsOptional()
  @IsString()
  doctorSlug?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date ต้องเป็นรูปแบบ YYYY-MM-DD' })
  date: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'time ต้องเป็นรูปแบบ HH:mm',
  })
  time: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อ' })
  @MaxLength(80)
  customerName: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '') : value,
  )
  @Matches(/^0\d{8,9}$/, { message: 'เบอร์โทรไม่ถูกต้อง' })
  phone: string;

  @Transform(trim)
  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  email: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  note?: string;
}
