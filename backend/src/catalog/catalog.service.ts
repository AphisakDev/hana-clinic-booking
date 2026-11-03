import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository.js';
import type { TreatmentFilter } from './catalog.types.js';

@Injectable()
export class CatalogService {
  constructor(private readonly catalog: CatalogRepository) {}

  listTreatments(filter: TreatmentFilter = {}) {
    return this.catalog.findTreatments(filter);
  }

  async getTreatment(slug: string) {
    const treatment = await this.catalog.findTreatmentBySlug(slug);
    if (!treatment) throw new NotFoundException('ไม่พบทรีตเมนต์นี้');
    return treatment;
  }

  listBranches() {
    return this.catalog.findBranches();
  }

  async listDoctors(branchSlug?: string) {
    if (!branchSlug) return this.catalog.findDoctors();
    const branch = await this.catalog.findBranchBySlug(branchSlug);
    if (!branch) throw new NotFoundException('ไม่พบสาขานี้');
    return this.catalog.findDoctors(branch.id);
  }
}
