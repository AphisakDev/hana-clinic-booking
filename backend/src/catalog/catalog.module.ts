import { Module } from '@nestjs/common';
import { usesInMemoryData } from '../common/data-source.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogRepository } from './catalog.repository.js';
import { CatalogService } from './catalog.service.js';
import { InMemoryCatalogRepository } from './in-memory-catalog.repository.js';
import { PrismaCatalogRepository } from './prisma-catalog.repository.js';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogService,
    {
      provide: CatalogRepository,
      useClass: usesInMemoryData()
        ? InMemoryCatalogRepository
        : PrismaCatalogRepository,
    },
  ],
  exports: [CatalogService, CatalogRepository],
})
export class CatalogModule {}
