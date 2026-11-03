export const TREATMENT_CATEGORIES = [
  'SKIN',
  'CONTOUR',
  'LASER',
  'CONSULT',
] as const;

export type TreatmentCategory = (typeof TREATMENT_CATEGORIES)[number];

export interface TreatmentStep {
  title: string;
  description: string;
}

export interface Treatment {
  id: string;
  slug: string;
  name: string;
  category: TreatmentCategory;
  badge: string;
  summary: string;
  description: string;
  highlight: string;
  priceThb: number;
  durationMin: number;
  imageUrl: string;
  popular: boolean;
  steps: TreatmentStep[];
  prepTips: string[];
  aftercare: string;
  sortOrder: number;
}

export interface Branch {
  id: string;
  slug: string;
  name: string;
  address: string;
  transit: string;
  /** Opening time in Asia/Bangkok, "HH:mm" */
  openTime: string;
  /** Closing time in Asia/Bangkok, "HH:mm" */
  closeTime: string;
}

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  title: string;
  experienceYears: number;
  bio: string;
  branchId: string;
}

export interface TreatmentFilter {
  category?: TreatmentCategory;
  search?: string;
}
