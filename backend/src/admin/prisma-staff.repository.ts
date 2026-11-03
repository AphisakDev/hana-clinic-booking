import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StaffRepository } from './staff.repository.js';

@Injectable()
export class PrismaStaffRepository extends StaffRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findByEmail(email: string) {
    return this.prisma.staff.findUnique({ where: { email } });
  }
}
