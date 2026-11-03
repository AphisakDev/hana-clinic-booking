import { Injectable } from '@nestjs/common';
import type { Treatment as TreatmentRow } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogRepository } from './catalog.repository.js';
import type {
  Treatment,
  TreatmentFilter,
  TreatmentStep,
} from './catalog.types.js';

@Injectable()
export class PrismaCatalogRepository extends CatalogRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findTreatments({ category, search }: TreatmentFilter = {}) {
    const q = search?.trim();
    const rows = await this.prisma.treatment.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { summary: { contains: q, mode: 'insensitive' } },
                { badge: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toTreatment);
  }

  async findTreatmentBySlug(slug: string) {
    const row = await this.prisma.treatment.findUnique({ where: { slug } });
    return row ? toTreatment(row) : null;
  }

  async findTreatmentById(id: string) {
    const row = await this.prisma.treatment.findUnique({ where: { id } });
    return row ? toTreatment(row) : null;
  }

  findBranches() {
    return this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }

  findBranchBySlug(slug: string) {
    return this.prisma.branch.findUnique({ where: { slug } });
  }

  findBranchById(id: string) {
    return this.prisma.branch.findUnique({ where: { id } });
  }

  findDoctors(branchId?: string) {
    return this.prisma.doctor.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { name: 'asc' },
    });
  }

  findDoctorBySlug(slug: string) {
    return this.prisma.doctor.findUnique({ where: { slug } });
  }

  findDoctorById(id: string) {
    return this.prisma.doctor.findUnique({ where: { id } });
  }
}

/** Maps a database row (with JSON columns) to the domain type. */
function toTreatment(row: TreatmentRow): Treatment {
  return {
    ...row,
    steps: row.steps as unknown as TreatmentStep[],
    prepTips: row.prepTips as unknown as string[],
  };
}
