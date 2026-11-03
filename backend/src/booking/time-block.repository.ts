import type { NewTimeBlock, TimeBlock } from './booking.types.js';

export abstract class TimeBlockRepository {
  /** Blocks for these doctors that overlap [from, to). */
  abstract findOverlapping(
    doctorIds: string[],
    from: Date,
    to: Date,
  ): Promise<TimeBlock[]>;

  abstract findById(id: string): Promise<TimeBlock | null>;

  abstract create(input: NewTimeBlock): Promise<TimeBlock>;

  abstract delete(id: string): Promise<void>;
}
