import { randomUUID } from 'node:crypto';
import type { NewTimeBlock, TimeBlock } from './booking.types.js';
import { overlaps } from './slot-calculator.js';
import { TimeBlockRepository } from './time-block.repository.js';

export class InMemoryTimeBlockRepository extends TimeBlockRepository {
  readonly blocks: TimeBlock[] = [];

  async findOverlapping(doctorIds: string[], from: Date, to: Date) {
    return this.blocks
      .filter(
        (b) =>
          doctorIds.includes(b.doctorId) &&
          overlaps(b, { startAt: from, endAt: to }),
      )
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  async findById(id: string) {
    return this.blocks.find((b) => b.id === id) ?? null;
  }

  async create(input: NewTimeBlock) {
    const block: TimeBlock = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.blocks.push(block);
    return block;
  }

  async delete(id: string) {
    const index = this.blocks.findIndex((b) => b.id === id);
    if (index >= 0) this.blocks.splice(index, 1);
  }
}
