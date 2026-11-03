/** Shapes returned by the NestJS API (see backend/src/**.types.ts). */

export type TreatmentCategory = 'SKIN' | 'CONTOUR' | 'LASER' | 'CONSULT';

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
  openTime: string;
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

export interface Slot {
  time: string;
  available: boolean;
}

export interface Availability {
  date: string;
  durationMin: number;
  slots: Slot[];
}

export interface NewBooking {
  treatmentSlug: string;
  branchSlug: string;
  doctorSlug?: string;
  date: string;
  time: string;
  customerName: string;
  phone: string;
  email: string;
  note?: string;
}

export interface Booking {
  reference: string;
  status: 'CONFIRMED' | 'CANCELLED';
  date: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  customerName: string;
  phone: string;
  email: string;
  note: string | null;
  treatment: Pick<Treatment, 'slug' | 'name' | 'priceThb' | 'durationMin' | 'imageUrl'>;
  branch: Pick<Branch, 'slug' | 'name' | 'address' | 'transit'>;
  doctor: Pick<Doctor, 'slug' | 'name' | 'title'>;
  cancelDeadline: string;
  canCancel: boolean;
}

export const CATEGORY_LABELS: Record<TreatmentCategory, string> = {
  SKIN: 'ดูแลผิว',
  CONTOUR: 'ปรับรูปหน้า',
  LASER: 'เลเซอร์',
  CONSULT: 'ปรึกษาแพทย์',
};
