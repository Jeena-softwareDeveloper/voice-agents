import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TenantsService } from '../../services/tenants/tenants.service';
import { CreateTenantDto, UpdateTenantStatusDto } from '../../dto/tenant.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @Roles('PLATFORM_ADMIN')
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  @Get()
  @Roles('PLATFORM_ADMIN')
  async getAllTenants() {
    return this.tenantsService.getAllTenants();
  }

  @Get(':id')
  @Roles('PLATFORM_ADMIN')
  async getTenantById(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @Put(':id/status')
  @Roles('PLATFORM_ADMIN')
  async updateTenantStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.tenantsService.updateTenantStatus(id, dto);
  }
}
