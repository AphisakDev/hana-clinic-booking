import { DEMO_STAFF } from './demo-staff.js';
import { hashPassword } from './password.js';
import { StaffRepository } from './staff.repository.js';
import type { Staff } from './staff.types.js';

export class InMemoryStaffRepository extends StaffRepository {
  private readonly staff: Promise<Staff[]>;

  constructor(accounts = DEMO_STAFF) {
    super();
    this.staff = Promise.all(
      accounts.map(async ({ password, ...account }, i) => ({
        ...account,
        id: `staff-${i + 1}`,
        passwordHash: await hashPassword(password),
      })),
    );
  }

  async findByEmail(email: string) {
    return (await this.staff).find((s) => s.email === email) ?? null;
  }
}
