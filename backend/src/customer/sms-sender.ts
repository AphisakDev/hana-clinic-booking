import { Injectable, Logger } from '@nestjs/common';

/** Port for sending SMS. Swap in a real provider (e.g. Twilio, ThaiBulkSMS) later. */
export abstract class SmsSender {
  abstract send(phone: string, message: string): Promise<void>;
}

/** Development stand-in: writes the message to the server log. */
@Injectable()
export class LogSmsSender extends SmsSender {
  private readonly logger = new Logger('SMS');

  async send(phone: string, message: string) {
    this.logger.log(`to ${phone.slice(0, 3)}xxx${phone.slice(-4)}: ${message}`);
  }
}
