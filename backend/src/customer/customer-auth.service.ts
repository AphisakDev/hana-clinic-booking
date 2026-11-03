import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { usesInMemoryData } from '../common/data-source.js';
import { customerJwtSecret } from '../common/jwt-config.js';
import { OtpService, type OtpRequestResult } from './otp.service.js';

export interface CustomerTokenPayload {
  phone: string;
}

/**
 * Demo builds show the code on screen so visitors can try the flow without
 * a real SMS. Never enable this on a site with real customers.
 */
export function showOtpOnScreen(): boolean {
  return process.env.OTP_SHOW_CODE === 'true' || usesInMemoryData();
}

@Injectable()
export class CustomerAuthService {
  static readonly TOKEN_TTL = '30m';

  constructor(
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Always answers the same way, whether or not the number has bookings,
   * so the API does not reveal who is a client.
   */
  async requestCode(
    phone: string,
  ): Promise<OtpRequestResult & { demoCode?: string }> {
    const { code, ...result } = await this.otp.request(phone);
    return showOtpOnScreen() ? { ...result, demoCode: code } : result;
  }

  async verify(phone: string, code: string) {
    const result = this.otp.check(phone, code);
    if (result === 'wrong') {
      throw new UnauthorizedException(
        `รหัสไม่ถูกต้อง เหลืออีก ${this.otp.attemptsLeft(phone)} ครั้ง`,
      );
    }
    if (result === 'locked') {
      throw new UnauthorizedException('กรอกรหัสผิดหลายครั้ง กรุณาขอรหัสใหม่');
    }
    if (result === 'expired') {
      throw new UnauthorizedException(
        'รหัสหมดอายุหรือถูกใช้ไปแล้ว กรุณาขอรหัสใหม่',
      );
    }
    const payload: CustomerTokenPayload = { phone };
    return {
      accessToken: await this.jwt.signAsync(payload, {
        secret: customerJwtSecret(),
        expiresIn: CustomerAuthService.TOKEN_TTL,
      }),
    };
  }
}
