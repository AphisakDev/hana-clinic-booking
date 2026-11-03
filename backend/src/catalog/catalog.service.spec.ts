import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { InMemoryCatalogRepository } from './in-memory-catalog.repository.js';

describe('CatalogService', () => {
  const service = new CatalogService(new InMemoryCatalogRepository());

  it('lists treatments in display order', async () => {
    const slugs = (await service.listTreatments()).map((t) => t.slug);
    expect(slugs[0]).toBe('hydrafacial');
    expect(slugs).toHaveLength(6);
  });

  it('filters by category', async () => {
    const result = await service.listTreatments({ category: 'CONTOUR' });
    expect(result.map((t) => t.slug)).toEqual([
      'filler-contour',
      'thread-lift',
    ]);
  });

  it('searches Thai and English text, ignoring case', async () => {
    expect(
      (await service.listTreatments({ search: 'hydra' })).map((t) => t.slug),
    ).toEqual(['hydrafacial']);
    expect(
      (await service.listTreatments({ search: 'เลเซอร์' })).map((t) => t.slug),
    ).toEqual(['laser-hair-removal']);
  });

  it('lists only doctors of the chosen branch', async () => {
    const doctors = await service.listDoctors('ari');
    expect(doctors.map((d) => d.slug)).toEqual(['pimchanok', 'kittipat']);
  });

  it('throws 404 for unknown slugs', async () => {
    await expect(service.getTreatment('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.listDoctors('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
