import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SalesPipelineService } from '../../services/sales-pipeline/sales-pipeline.service';
import { UpdatePipelineStageDto } from '../../dto/pipeline.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('sales-pipeline')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SalesPipelineController {
  constructor(private pipelineService: SalesPipelineService) {}

  @Get('stages')
  async getPipelineStages(@CurrentTenant() tenantId: string) {
    return this.pipelineService.getPipelineStages(tenantId);
  }

  @Put('move-stage')
  async moveStage(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdatePipelineStageDto,
    @CurrentUser() user: any,
  ) {
    return this.pipelineService.moveStage(tenantId, dto.leadId, dto.newStage, dto.reason, user?.id);
  }

  @Get(':leadId/history')
  async getHistory(@CurrentTenant() tenantId: string, @Param('leadId') leadId: string) {
    return this.pipelineService.getPipelineHistory(tenantId, leadId);
  }
}
