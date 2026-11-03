import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { ListTreatmentsQuery } from './dto/list-treatments.query.js';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('treatments')
  listTreatments(@Query() query: ListTreatmentsQuery) {
    return this.catalog.listTreatments({
      category: query.category,
      search: query.q,
    });
  }

  @Get('treatments/:slug')
  getTreatment(@Param('slug') slug: string) {
    return this.catalog.getTreatment(slug);
  }

  @Get('branches')
  listBranches() {
    return this.catalog.listBranches();
  }

  @Get('doctors')
  listDoctors(@Query('branch') branch?: string) {
    return this.catalog.listDoctors(branch);
  }
}
