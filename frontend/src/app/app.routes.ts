import { Routes } from '@angular/router';
import { adminGuard } from './admin/admin.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'ทรีตเมนต์ · HANA Clinic',
    loadComponent: () => import('./pages/treatments/treatments-page').then((m) => m.TreatmentsPage),
  },
  {
    path: 'treatments/:slug',
    title: 'รายละเอียดทรีตเมนต์ · HANA Clinic',
    loadComponent: () =>
      import('./pages/treatment-detail/treatment-detail-page').then((m) => m.TreatmentDetailPage),
  },
  {
    path: 'book/:slug',
    title: 'จองคิว · HANA Clinic',
    loadComponent: () => import('./pages/booking/booking-page').then((m) => m.BookingPage),
  },
  {
    path: 'bookings/:reference',
    title: 'นัดหมายของคุณ · HANA Clinic',
    loadComponent: () =>
      import('./pages/booking-confirmed/booking-confirmed-page').then(
        (m) => m.BookingConfirmedPage,
      ),
  },
  {
    path: 'doctors',
    title: 'ทีมแพทย์ · HANA Clinic',
    loadComponent: () => import('./pages/doctors/doctors-page').then((m) => m.DoctorsPage),
  },
  {
    path: 'my-bookings',
    title: 'นัดหมายของฉัน · HANA Clinic',
    loadComponent: () =>
      import('./pages/my-bookings/my-bookings-page').then((m) => m.MyBookingsPage),
  },
  {
    path: 'admin/login',
    title: 'เข้าสู่ระบบพนักงาน · HANA Clinic',
    loadComponent: () => import('./admin/login/admin-login-page').then((m) => m.AdminLoginPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        title: 'ภาพรวม · HANA Staff',
        loadComponent: () =>
          import('./admin/dashboard/admin-dashboard-page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'schedule',
        title: 'ตารางนัด · HANA Staff',
        loadComponent: () =>
          import('./admin/schedule/admin-schedule-page').then((m) => m.AdminSchedulePage),
      },
    ],
  },
  {
    path: '**',
    title: 'ไม่พบหน้านี้ · HANA Clinic',
    loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
