import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BusinessOnboardingService } from '../../services/business-onboarding/business-onboarding.service';
import { CompleteBusinessOnboardingDto } from '../../dto/tenant.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('business-onboarding')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BusinessOnboardingController {
  constructor(private onboardingService: BusinessOnboardingService) {}

  @Get('status')
  async getStatus(@CurrentTenant() tenantId: string) {
    return this.onboardingService.getOnboardingStatus(tenantId);
  }

  @Post('save')
  async saveProfile(@CurrentTenant() tenantId: string, @Body() dto: CompleteBusinessOnboardingDto) {
    return this.onboardingService.saveOnboardingProfile(tenantId, dto);
  }
}
