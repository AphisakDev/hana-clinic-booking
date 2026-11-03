import type { Staff } from './staff.types.js';

export abstract class StaffRepository {
  abstract findByEmail(email: string): Promise<Staff | null>;
}
