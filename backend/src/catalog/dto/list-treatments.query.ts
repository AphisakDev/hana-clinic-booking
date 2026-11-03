import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  TREATMENT_CATEGORIES,
  type TreatmentCategory,
} from '../catalog.types.js';

export class ListTreatmentsQuery {
  @IsOptional()
  @IsIn(TREATMENT_CATEGORIES)
  category?: TreatmentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;
}
