import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LeadsService } from '../../services/leads/leads.service';
import { CreateLeadDto, UpdateLeadDto } from '../../dto/lead.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { LeadStatus } from '@prisma/client';

@Controller('leads')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  async createLead(@CurrentTenant() tenantId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.createLead(tenantId, dto);
  }

  @Get()
  async getTenantLeads(
    @CurrentTenant() tenantId: string,
    @Query('serviceId') serviceId?: string,
    @Query('status') status?: LeadStatus,
    @Query('search') search?: string,
  ) {
    return this.leadsService.getTenantLeads(tenantId, { serviceId, status, search });
  }

  @Get(':id')
  async getLeadById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.leadsService.getLeadById(tenantId, id);
  }

  @Put(':id')
  async updateLead(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.updateLead(tenantId, id, dto, user?.id);
  }
}
