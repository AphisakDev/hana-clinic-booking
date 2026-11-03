import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { customerJwtSecret } from '../common/jwt-config.js';
import type { CustomerTokenPayload } from './customer-auth.service.js';

export interface CustomerRequest extends Request {
  customer?: CustomerTokenPayload;
}

/** Accepts only tokens issued after an OTP check (not staff tokens). */
@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('กรุณายืนยันเบอร์โทรก่อน');
    }
    try {
      request.customer = await this.jwt.verifyAsync<CustomerTokenPayload>(
        token,
        {
          secret: customerJwtSecret(),
        },
      );
      return true;
    } catch {
      throw new UnauthorizedException('การยืนยันหมดอายุ กรุณาขอรหัสใหม่');
    }
  }
}
