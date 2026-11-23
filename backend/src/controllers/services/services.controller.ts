import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from '../../services/services/services.service';
import { CreateServiceDto, UpdateServiceDto } from '../../dto/service.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  async createService(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesService.createService(tenantId, dto, user?.id);
  }

  @Post('extract-material')
  async extractMarketingMaterials(
    @CurrentTenant() tenantId: string,
    @Body() body: { files: any[]; serviceContext: any },
  ) {
    return this.servicesService.extractMarketingMaterials(
      tenantId,
      body.files || [],
      body.serviceContext || {},
    );
  }

  @Post('generate-ai-config')
  async generateAiCallingConfig(
    @CurrentTenant() tenantId: string,
    @Body() body: { serviceContext: any; extractedInfo?: any },
  ) {
    return this.servicesService.generateAiCallingConfig(
      tenantId,
      body.serviceContext,
      body.extractedInfo,
    );
  }

  @Post('generate-workflow-stages')
  async generateWorkflowStages(
    @CurrentTenant() tenantId: string,
    @Body() body: { serviceContext: any; extractedInfo?: any },
  ) {
    return this.servicesService.generateWorkflowStages(
      tenantId,
      body.serviceContext,
      body.extractedInfo,
    );
  }

  @Get()
  async getTenantServices(@CurrentTenant() tenantId: string) {
    return this.servicesService.getTenantServices(tenantId);
  }

  @Get(':id')
  async getServiceById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.servicesService.getServiceById(tenantId, id);
  }

  @Put(':id/approve-config')
  async approveServiceAiConfig(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.servicesService.approveServiceAiConfig(tenantId, id, user?.id);
  }

  @Put(':id/stages')
  async updateFollowUpStages(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { stages: any[] },
  ) {
    return this.servicesService.updateFollowUpStages(tenantId, id, body.stages || [], user?.id);
  }

  @Put(':id')
  async updateService(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.updateService(tenantId, id, dto);
  }

  @Delete(':id')
  async deleteService(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.servicesService.deleteService(tenantId, id);
  }
}
