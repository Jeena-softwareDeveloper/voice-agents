import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from '../../services/reports/reports.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  async getTenantReport(@CurrentTenant() tenantId: string) {
    return this.reportsService.getTenantReport(tenantId);
  }
}
