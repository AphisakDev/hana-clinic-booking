import type {
  Branch,
  Doctor,
  Treatment,
  TreatmentFilter,
} from './catalog.types.js';

/**
 * Port for reading the clinic catalog. Services depend on this abstraction,
 * so tests can swap in {@link InMemoryCatalogRepository} instead of a database.
 * (An abstract class doubles as the Nest DI token.)
 */
export abstract class CatalogRepository {
  abstract findTreatments(filter?: TreatmentFilter): Promise<Treatment[]>;
  abstract findTreatmentBySlug(slug: string): Promise<Treatment | null>;
  abstract findTreatmentById(id: string): Promise<Treatment | null>;
  abstract findBranches(): Promise<Branch[]>;
  abstract findBranchBySlug(slug: string): Promise<Branch | null>;
  abstract findBranchById(id: string): Promise<Branch | null>;
  abstract findDoctors(branchId?: string): Promise<Doctor[]>;
  abstract findDoctorBySlug(slug: string): Promise<Doctor | null>;
  abstract findDoctorById(id: string): Promise<Doctor | null>;
}
