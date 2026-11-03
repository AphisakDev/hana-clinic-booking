import { HttpException } from '@nestjs/common';
import { bangkokDateTime } from '../common/bangkok-time.js';
import { FixedClock } from '../common/clock.js';
import { OtpService } from './otp.service.js';
import { SmsSender } from './sms-sender.js';

class FakeSms extends SmsSender {
  readonly sent: { phone: string; message: string }[] = [];
  async send(phone: string, message: string) {
    this.sent.push({ phone, message });
  }
}

describe('OtpService', () => {
  const phone = '0891231840';
  let clock: FixedClock;
  let sms: FakeSms;
  let otp: OtpService;
  const start = bangkokDateTime('2026-11-10', '10:00');
  const later = (sec: number) =>
    clock.set(new Date(start.getTime() + sec * 1000));

  beforeEach(() => {
    clock = new FixedClock(start);
    sms = new FakeSms();
    otp = new OtpService(sms, clock);
  });

  it('sends a 6-digit code by SMS and accepts it once', async () => {
    const { code } = await otp.request(phone);
    expect(code).toMatch(/^\d{6}$/);
    expect(sms.sent[0].message).toContain(code);

    expect(otp.check(phone, code)).toBe('ok');
    expect(otp.check(phone, code)).toBe('expired'); // single use
  });

  it('does not accept a code for another phone number', async () => {
    const { code } = await otp.request(phone);
    expect(otp.check('0812345678', code)).toBe('expired');
  });

  it('expires after 5 minutes', async () => {
    const { code } = await otp.request(phone);
    later(5 * 60 + 1);
    expect(otp.check(phone, code)).toBe('expired');
  });

  it('throws the code away after 5 wrong guesses', async () => {
    const { code } = await otp.request(phone);
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) expect(otp.check(phone, wrong)).toBe('wrong');
    expect(otp.attemptsLeft(phone)).toBe(1);
    expect(otp.check(phone, wrong)).toBe('locked');
    expect(otp.check(phone, code)).toBe('expired'); // even the right one is gone now
  });

  it('makes the user wait 60 s between codes, and only the newest code works', async () => {
    const first = await otp.request(phone);
    await expect(otp.request(phone)).rejects.toBeInstanceOf(HttpException);

    later(60);
    const second = await otp.request(phone);
    if (first.code !== second.code)
      expect(otp.check(phone, first.code)).toBe('wrong');
    expect(otp.check(phone, second.code)).toBe('ok');
  });

  it('allows at most 5 codes per hour per number', async () => {
    for (let i = 0; i < 5; i++) {
      later(i * 61);
      await otp.request(phone);
    }
    later(5 * 61);
    const error = await otp.request(phone).catch((e: HttpException) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect((error as HttpException).getResponse()).toMatchObject({
      retryAfterSec: expect.any(Number),
    });

    later(60 * 60 + 1); // the first send is now over an hour old
    await expect(otp.request(phone)).resolves.toBeDefined();
  });

  it('never stores the code in plain text', async () => {
    const { code } = await otp.request(phone);
    const stored = JSON.stringify([
      ...(otp as unknown as { pending: Map<string, unknown> }).pending,
    ]);
    expect(stored).not.toContain(code);
  });
});
