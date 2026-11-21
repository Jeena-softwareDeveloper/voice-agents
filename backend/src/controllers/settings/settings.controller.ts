import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from '../../services/settings/settings.service';
import { UpdateTenantCallingSettingsDto } from '../../dto/settings.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('calling')
  async getCallingSettings(@CurrentTenant() tenantId: string) {
    return this.settingsService.getTenantCallingSettings(tenantId);
  }

  @Put('calling')
  async updateCallingSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantCallingSettingsDto,
  ) {
    return this.settingsService.updateTenantCallingSettings(tenantId, dto);
  }
}
