import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { addMinutes } from '../common/bangkok-time.js';
import { Clock } from '../common/clock.js';
import { jwtSecret } from '../common/jwt-config.js';
import { SmsSender } from './sms-sender.js';

interface PendingCode {
  hash: Buffer;
  expiresAt: Date;
  attemptsLeft: number;
}

export interface OtpRequestResult {
  expiresInSec: number;
  resendInSec: number;
}

export type OtpCheck = 'ok' | 'wrong' | 'expired' | 'locked';

/**
 * One-time codes for customers to look up their bookings by phone.
 *
 * - 6 digits, valid for 5 minutes, usable once
 * - 5 wrong guesses and the code is thrown away (1 in 200,000 to guess it)
 * - one new code per 60 s and at most 5 per hour for each phone number
 *
 * Codes are stored as HMACs, never in plain text. The store lives in memory,
 * which is fine for one server; several servers would need a shared store
 * such as Redis.
 */
@Injectable()
export class OtpService {
  static readonly CODE_TTL_MIN = 5;
  static readonly MAX_ATTEMPTS = 5;
  static readonly RESEND_COOLDOWN_SEC = 60;
  static readonly MAX_SENDS_PER_HOUR = 5;

  private readonly pending = new Map<string, PendingCode>();
  private readonly sends = new Map<string, Date[]>();

  constructor(
    private readonly sms: SmsSender,
    private readonly clock: Clock,
  ) {}

  /** Creates and sends a new code. Returns the code too, for demo mode only. */
  async request(phone: string): Promise<OtpRequestResult & { code: string }> {
    const now = this.clock.now();
    const recent = (this.sends.get(phone) ?? []).filter(
      (at) => now.getTime() - at.getTime() < 60 * 60 * 1000,
    );

    const last = recent.at(-1);
    const sinceLastSec = last
      ? (now.getTime() - last.getTime()) / 1000
      : Infinity;
    if (sinceLastSec < OtpService.RESEND_COOLDOWN_SEC) {
      throw tooManyRequests(
        'กรุณารอสักครู่ก่อนขอรหัสใหม่',
        Math.ceil(OtpService.RESEND_COOLDOWN_SEC - sinceLastSec),
      );
    }
    if (recent.length >= OtpService.MAX_SENDS_PER_HOUR) {
      const retryAfterSec = Math.ceil(
        (recent[0].getTime() + 60 * 60 * 1000 - now.getTime()) / 1000,
      );
      throw tooManyRequests(
        'ขอรหัสบ่อยเกินไป กรุณาลองใหม่ภายหลัง',
        retryAfterSec,
      );
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    this.pending.set(phone, {
      hash: hashCode(phone, code),
      expiresAt: addMinutes(now, OtpService.CODE_TTL_MIN),
      attemptsLeft: OtpService.MAX_ATTEMPTS,
    });
    this.sends.set(phone, [...recent, now]);

    await this.sms.send(
      phone,
      `รหัสยืนยัน HANA ของคุณคือ ${code} (ใช้ได้ ${OtpService.CODE_TTL_MIN} นาที ห้ามบอกผู้อื่น)`,
    );
    return {
      code,
      expiresInSec: OtpService.CODE_TTL_MIN * 60,
      resendInSec: OtpService.RESEND_COOLDOWN_SEC,
    };
  }

  /** Checks a code. A correct code is used up; so is one with no attempts left. */
  check(phone: string, code: string): OtpCheck {
    const entry = this.pending.get(phone);
    if (!entry) return 'expired';
    if (this.clock.now() > entry.expiresAt) {
      this.pending.delete(phone);
      return 'expired';
    }
    if (timingSafeEqual(entry.hash, hashCode(phone, code))) {
      this.pending.delete(phone);
      return 'ok';
    }
    entry.attemptsLeft--;
    if (entry.attemptsLeft <= 0) {
      this.pending.delete(phone);
      return 'locked';
    }
    return 'wrong';
  }

  attemptsLeft(phone: string): number {
    return this.pending.get(phone)?.attemptsLeft ?? 0;
  }
}

function hashCode(phone: string, code: string): Buffer {
  return createHmac('sha256', jwtSecret()).update(`${phone}:${code}`).digest();
}

function tooManyRequests(message: string, retryAfterSec: number) {
  return new HttpException(
    { statusCode: HttpStatus.TOO_MANY_REQUESTS, message, retryAfterSec },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}
