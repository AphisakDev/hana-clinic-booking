import { Injectable } from '@nestjs/common';

/**
 * Abstraction over "now" so time-dependent rules (no booking in the past,
 * cancellation deadline) can be tested with a fixed time.
 */
export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

export class FixedClock extends Clock {
  constructor(private current: Date) {
    super();
  }

  now(): Date {
    return new Date(this.current);
  }

  set(instant: Date) {
    this.current = instant;
  }
}
