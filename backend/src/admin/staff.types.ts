export type StaffRole = 'ADMIN' | 'RECEPTION';

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  passwordHash: string;
}

/** What the API ever reveals about a staff member. */
export type StaffProfile = Omit<Staff, 'passwordHash'>;

/** Claims stored in the JWT. */
export interface StaffTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: StaffRole;
}
