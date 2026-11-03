import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { NewTimeBlock } from './booking.types.js';
import { TimeBlockRepository } from './time-block.repository.js';

@Injectable()
export class PrismaTimeBlockRepository extends TimeBlockRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findOverlapping(doctorIds: string[], from: Date, to: Date) {
    return this.prisma.timeBlock.findMany({
      where: {
        doctorId: { in: doctorIds },
        startAt: { lt: to },
        endAt: { gt: from },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.timeBlock.findUnique({ where: { id } });
  }

  create(input: NewTimeBlock) {
    return this.prisma.timeBlock.create({ data: input });
  }

  async delete(id: string) {
    await this.prisma.timeBlock.delete({ where: { id } });
  }
}
