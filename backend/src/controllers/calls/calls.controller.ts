import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CallsService } from '../../services/calls/calls.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('calls')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Get()
  async getTenantCalls(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: any,
    @Query('outcome') outcome?: any,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.callsService.getTenantCalls(tenantId, { status, outcome, serviceId });
  }

  @Get(':id')
  async getCallById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.callsService.getCallById(tenantId, id);
  }
}
