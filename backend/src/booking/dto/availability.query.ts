import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class AvailabilityQuery {
  @IsString()
  @IsNotEmpty()
  treatment: string;

  @IsString()
  @IsNotEmpty()
  branch: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date ต้องเป็นรูปแบบ YYYY-MM-DD' })
  date: string;

  @IsOptional()
  @IsString()
  doctor?: string;
}
