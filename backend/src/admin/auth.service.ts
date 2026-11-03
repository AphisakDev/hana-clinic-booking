import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from './password.js';
import { StaffRepository } from './staff.repository.js';
import type { StaffProfile, StaffTokenPayload } from './staff.types.js';

export interface LoginResult {
  accessToken: string;
  staff: StaffProfile;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly staff: StaffRepository,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const account = await this.staff.findByEmail(email.trim().toLowerCase());
    // Same message for "no such user" and "wrong password", so the API does
    // not reveal which emails exist.
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    const payload: StaffTokenPayload = {
      sub: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      staff: {
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role,
      },
    };
  }
}
