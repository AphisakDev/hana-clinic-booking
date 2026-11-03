import { BRANCHES, DOCTORS, TREATMENTS } from './catalog.data.js';
import { CatalogRepository } from './catalog.repository.js';
import type {
  Branch,
  Doctor,
  Treatment,
  TreatmentFilter,
} from './catalog.types.js';
import { matchesTreatmentFilter } from './treatment-filter.js';

export class InMemoryCatalogRepository extends CatalogRepository {
  constructor(
    private readonly treatments: Treatment[] = TREATMENTS,
    private readonly branches: Branch[] = BRANCHES,
    private readonly doctors: Doctor[] = DOCTORS,
  ) {
    super();
  }

  async findTreatments(filter: TreatmentFilter = {}): Promise<Treatment[]> {
    return this.treatments
      .filter((t) => matchesTreatmentFilter(t, filter))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findTreatmentBySlug(slug: string) {
    return this.treatments.find((t) => t.slug === slug) ?? null;
  }

  async findTreatmentById(id: string) {
    return this.treatments.find((t) => t.id === id) ?? null;
  }

  async findBranches() {
    return [...this.branches];
  }

  async findBranchBySlug(slug: string) {
    return this.branches.find((b) => b.slug === slug) ?? null;
  }

  async findBranchById(id: string) {
    return this.branches.find((b) => b.id === id) ?? null;
  }

  async findDoctors(branchId?: string) {
    return this.doctors.filter((d) => !branchId || d.branchId === branchId);
  }

  async findDoctorBySlug(slug: string) {
    return this.doctors.find((d) => d.slug === slug) ?? null;
  }

  async findDoctorById(id: string) {
    return this.doctors.find((d) => d.id === id) ?? null;
  }
}
