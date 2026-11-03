/**
 * DATA_SOURCE=memory runs the API on in-memory repositories with the sample
 * catalog: no database needed. Handy for a quick demo or a free hosting tier.
 * Anything else (the default) uses PostgreSQL through Prisma.
 */
export function usesInMemoryData(): boolean {
  return process.env.DATA_SOURCE === 'memory';
}
