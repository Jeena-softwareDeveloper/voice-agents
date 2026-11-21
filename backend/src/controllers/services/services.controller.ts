import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from '../../services/services/services.service';
import { CreateServiceDto, UpdateServiceDto } from '../../dto/service.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  async createService(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.createService(tenantId, dto);
  }

  @Get()
  async getTenantServices(@CurrentTenant() tenantId: string) {
    return this.servicesService.getTenantServices(tenantId);
  }

  @Get(':id')
  async getServiceById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.servicesService.getServiceById(tenantId, id);
  }

  @Put(':id')
  async updateService(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.updateService(tenantId, id, dto);
  }
}
