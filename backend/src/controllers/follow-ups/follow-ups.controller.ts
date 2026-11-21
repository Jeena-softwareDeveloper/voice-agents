import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FollowUpsService } from '../../services/follow-ups/follow-ups.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from '../../dto/follow-up.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FollowUpsController {
  constructor(private followUpsService: FollowUpsService) {}

  @Get()
  async getTenantFollowUps(
    @CurrentTenant() tenantId: string,
    @Query('filter') filter?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all',
  ) {
    return this.followUpsService.getTenantFollowUps(tenantId, filter);
  }

  @Post()
  async createFollowUp(@CurrentTenant() tenantId: string, @Body() dto: CreateFollowUpDto) {
    return this.followUpsService.createFollowUp(tenantId, dto);
  }

  @Put(':id')
  async updateFollowUp(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpDto,
  ) {
    return this.followUpsService.updateFollowUp(tenantId, id, dto);
  }
}
