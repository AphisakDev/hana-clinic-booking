import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BookingRepository,
  DuplicateReferenceError,
} from './booking.repository.js';
import {
  BLOCKING_STATUSES,
  type Booking,
  type BookingStatus,
  type NewBooking,
} from './booking.types.js';

@Injectable()
export class PrismaBookingRepository extends BookingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findBusyPeriods(doctorIds: string[], from: Date, to: Date) {
    return this.prisma.booking.findMany({
      where: {
        status: { in: BLOCKING_STATUSES },
        doctorId: { in: doctorIds },
        startAt: { lt: to },
        endAt: { gt: from },
      },
      select: { doctorId: true, startAt: true, endAt: true },
    });
  }

  async createIfSlotFree(input: NewBooking): Promise<Booking | null> {
    try {
      // SERIALIZABLE makes "check then insert" safe: if two requests race for
      // the same doctor and time, Postgres aborts one of them (P2034).
      return await this.prisma.$transaction(
        async (tx) => {
          const clash = await tx.booking.findFirst({
            where: {
              status: { in: BLOCKING_STATUSES },
              doctorId: input.doctorId,
              startAt: { lt: input.endAt },
              endAt: { gt: input.startAt },
            },
            select: { id: true },
          });
          if (clash) return null;
          return tx.booking.create({ data: input });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034') return null; // lost the race
        if (error.code === 'P2002') {
          throw new DuplicateReferenceError(input.reference);
        }
      }
      throw error;
    }
  }

  findByReference(reference: string) {
    return this.prisma.booking.findUnique({ where: { reference } });
  }

  findByPhone(phone: string) {
    return this.prisma.booking.findMany({
      where: { phone },
      orderBy: { startAt: 'desc' },
    });
  }

  markCancelled(id: string, at: Date) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: at, statusAt: at },
    });
  }

  updateStatus(id: string, status: BookingStatus, at: Date) {
    return this.prisma.booking.update({
      where: { id },
      data: {
        status,
        statusAt: at,
        ...(status === 'CANCELLED' ? { cancelledAt: at } : {}),
      },
    });
  }

  findStartingBetween(from: Date, to: Date, branchId?: string) {
    return this.prisma.booking.findMany({
      where: {
        startAt: { gte: from, lt: to },
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { startAt: 'asc' },
    });
  }
}
