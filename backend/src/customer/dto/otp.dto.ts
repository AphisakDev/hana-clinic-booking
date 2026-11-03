import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

/** Same normalisation as when booking: "089-123-1840" → "0891231840". */
const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

export class RequestOtpDto {
  @Transform(normalizePhone)
  @Matches(/^0\d{8,9}$/, { message: 'เบอร์โทรไม่ถูกต้อง' })
  phone: string;
}

export class VerifyOtpDto extends RequestOtpDto {
  @Matches(/^\d{6}$/, { message: 'รหัสต้องเป็นตัวเลข 6 หลัก' })
  code: string;
}
