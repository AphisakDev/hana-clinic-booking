import type { Treatment, TreatmentFilter } from './catalog.types.js';

/** Case-insensitive search across the fields a customer would type about. */
export function matchesTreatmentFilter(
  treatment: Treatment,
  { category, search }: TreatmentFilter,
): boolean {
  if (category && treatment.category !== category) return false;
  const q = search?.trim().toLowerCase();
  if (!q) return true;
  return [treatment.name, treatment.summary, treatment.badge].some((field) =>
    field.toLowerCase().includes(q),
  );
}
