import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from '../../services/reports/reports.service';
import { LeadsService } from '../../services/leads/leads.service';
import { ServicesService } from '../../services/services/services.service';
import { AiConversationsService } from '../../services/ai-conversations/ai-conversations.service';
import { CallsService } from '../../services/calls/calls.service';
import { PaymentsService } from '../../services/payments/payments.service';
import { SettingsService } from '../../services/settings/settings.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ConfigureServiceAiConfigDto, CreateAiConversationTemplateDto } from '../../dto/ai-conversation.dto';
import { UpdateGlobalSettingsDto } from '../../dto/settings.dto';

@Controller('platform-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformAdminController {
  constructor(
    private reportsService: ReportsService,
    private leadsService: LeadsService,
    private servicesService: ServicesService,
    private aiConversationsService: AiConversationsService,
    private callsService: CallsService,
    private paymentsService: PaymentsService,
    private settingsService: SettingsService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    return this.reportsService.getPlatformDashboard();
  }

  @Get('calls/overview')
  async getCallsOverview() {
    const dashboard = await this.reportsService.getPlatformDashboard();
    return {
      totalLeads: dashboard.totalLeads,
      totalCalls: dashboard.totalCalls,
      connectedCalls: dashboard.connectedCalls,
      failedCalls: dashboard.failedCalls,
      totalBillableMinutes: dashboard.totalBillableMinutes,
      totalProviderCost: dashboard.totalProviderCost,
    };
  }

  @Get('calls/leads')
  async getAllLeads(
    @Query('tenantId') tenantId?: string,
    @Query('serviceCategory') serviceCategory?: string,
    @Query('search') search?: string,
  ) {
    return this.leadsService.getAllLeadsForAdmin({ tenantId, serviceCategory, search });
  }

  @Get('calls/services')
  async getAllServices(@Query('tenantId') tenantId?: string, @Query('status') status?: any) {
    return this.servicesService.getAllServicesForAdmin(tenantId, status);
  }

  @Get('calls/history')
  async getCallHistory(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: any,
    @Query('outcome') outcome?: any,
  ) {
    return this.callsService.getAllCallsForAdmin({ tenantId, status, outcome });
  }

  @Get('ai-conversations/templates')
  async getTemplates() {
    return this.aiConversationsService.getTemplates();
  }

  @Post('ai-conversations/templates')
  async createTemplate(@Body() dto: CreateAiConversationTemplateDto) {
    return this.aiConversationsService.createTemplate(dto);
  }

  @Post('services/approve-ai-config')
  async configureAndApproveServiceAi(@Body() dto: ConfigureServiceAiConfigDto) {
    return this.aiConversationsService.configureAndApproveServiceAi(dto);
  }

  @Post('services/test-conversation/:configId')
  async testConversation(@Param('configId') configId: string) {
    return this.aiConversationsService.testConversation(configId);
  }

  @Get('ai-options')
  async getAiOptions() {
    return this.aiConversationsService.getVoiceAndLanguageOptions();
  }

  @Get('payments/overview')
  async getPaymentsOverview() {
    return this.paymentsService.getPlatformPaymentsOverview();
  }

  @Get('settings')
  async getSettings() {
    return this.settingsService.getPlatformSettings();
  }

  @Put('settings')
  async updateSettings(@Body() dto: UpdateGlobalSettingsDto) {
    return this.settingsService.updatePlatformSettings(dto);
  }
}
