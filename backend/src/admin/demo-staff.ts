import type { StaffRole } from './staff.types.js';

/**
 * Demo accounts for the portfolio build. Used by the database seed and the
 * in-memory mode. Change or remove them before running anything real.
 */
export const DEMO_STAFF: {
  email: string;
  name: string;
  role: StaffRole;
  password: string;
}[] = [
  {
    email: 'admin@hana.test',
    name: 'แอดมิน (เดโม)',
    role: 'ADMIN',
    password: 'hana1234',
  },
];
