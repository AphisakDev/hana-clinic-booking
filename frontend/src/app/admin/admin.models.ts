export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

export type StaffRole = 'ADMIN' | 'RECEPTION';

export interface StaffProfile {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
}

export interface LoginResult {
  accessToken: string;
  staff: StaffProfile;
}

export interface AdminBooking {
  reference: string;
  status: BookingStatus;
  nextStatuses: BookingStatus[];
  startTime: string;
  endTime: string;
  customerName: string;
  phone: string;
  email: string;
  note: string | null;
  treatment: { slug: string; name: string; priceThb: number };
  doctorSlug: string;
}

export interface TimeBlock {
  id: string;
  doctorSlug: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface Schedule {
  date: string;
  branch: { slug: string; name: string; openTime: string; closeTime: string };
  doctors: {
    slug: string;
    name: string;
    title: string;
    bookings: AdminBooking[];
    blocks: TimeBlock[];
  }[];
  summary: {
    total: number;
    byStatus: Record<BookingStatus, number>;
    expectedRevenueThb: number;
  };
}

export interface Stats {
  today: string;
  todayBookings: number;
  todayTotal: number;
  todayByStatus: Record<BookingStatus, number>;
  todayRevenueThb: number;
  todayCompletedRevenueThb: number;
  next7DaysBookings: number;
  noShowRate30d: number | null;
  topTreatments30d: { slug: string; name: string; count: number }[];
  daily: { date: string; bookings: number }[];
}

export interface NewTimeBlock {
  doctorSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'รอเข้ารับบริการ',
  CHECKED_IN: 'มาถึงแล้ว',
  COMPLETED: 'เสร็จสิ้น',
  NO_SHOW: 'ไม่มาตามนัด',
  CANCELLED: 'ยกเลิก',
};

/** Button text for moving a booking *to* a status. */
export const STATUS_ACTIONS: Record<BookingStatus, string> = {
  CONFIRMED: 'ย้อนกลับ',
  CHECKED_IN: 'เช็กอิน',
  COMPLETED: 'ทำเสร็จแล้ว',
  NO_SHOW: 'ไม่มา',
  CANCELLED: 'ยกเลิกนัด',
};
