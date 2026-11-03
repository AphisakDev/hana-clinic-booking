import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { StaffTokenPayload } from './staff.types.js';

export interface StaffRequest extends Request {
  staff?: StaffTokenPayload;
}

/** Lets a request through only with a valid "Authorization: Bearer <jwt>". */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StaffRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('กรุณาเข้าสู่ระบบ');
    }
    try {
      request.staff = await this.jwt.verifyAsync<StaffTokenPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }
  }
}
