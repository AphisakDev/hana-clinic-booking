import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard, type StaffRequest } from './admin.guard.js';
import { AdminService } from './admin.service.js';
import { AuthService } from './auth.service.js';
import {
  ChangeStatusDto,
  CreateBlockDto,
  ScheduleQuery,
  StatsQuery,
} from './dto/admin.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('me')
  me(@Req() req: StaffRequest) {
    const { sub, email, name, role } = req.staff!;
    return { id: sub, email, name, role };
  }

  @Get('schedule')
  schedule(@Query() query: ScheduleQuery) {
    return this.admin.getSchedule(query.date, query.branch);
  }

  @Get('stats')
  stats(@Query() query: StatsQuery) {
    return this.admin.getStats(query.branch);
  }

  @Patch('bookings/:reference/status')
  changeStatus(
    @Param('reference') reference: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.admin.changeStatus(reference, dto.status);
  }

  @Post('blocks')
  createBlock(@Body() dto: CreateBlockDto) {
    return this.admin.createBlock(dto);
  }

  @Delete('blocks/:id')
  @HttpCode(204)
  deleteBlock(@Param('id') id: string) {
    return this.admin.deleteBlock(id);
  }
}
