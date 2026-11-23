import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportsService } from '../../services/reports/reports.service';
import { LeadsService } from '../../services/leads/leads.service';
import { ServicesService } from '../../services/services/services.service';
import { AiConversationsService } from '../../services/ai-conversations/ai-conversations.service';
import { CallsService } from '../../services/calls/calls.service';
import { PaymentsService } from '../../services/payments/payments.service';
import { SettingsService } from '../../services/settings/settings.service';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';
import { TelephonyService } from '../../integrations/telephony/telephony.service';
import { PrismaService } from '../../database/prisma.service';
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
    private sarvamService: SarvamService,
    private telephonyService: TelephonyService,
    private prisma: PrismaService,
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

  // ==========================================
  // SARVAM AI CENTRAL PROVIDER CONTROL
  // ==========================================

  @Get('sarvam/status')
  async getSarvamStatus() {
    return this.sarvamService.verifyCredentials();
  }

  @Post('sarvam/test-connection')
  async testSarvamConnection() {
    return this.sarvamService.verifyCredentials();
  }

  @Get('sarvam/metrics')
  async getSarvamMetrics() {
    return this.sarvamService.getGlobalMetrics();
  }

  @Get('sarvam/logs')
  async getSarvamLogs() {
    return this.sarvamService.getProviderAuditLogs();
  }

  // ==========================================
  // TELEPHONY NUMBER MANAGEMENT
  // ==========================================

  @Get('telephony/numbers')
  async getAllTelephonyNumbers() {
    return this.telephonyService.getAllNumbers();
  }

  @Post('telephony/numbers')
  async addTelephonyNumber(
    @Body()
    dto: {
      number: string;
      region: string;
      type: 'DID_LOCAL' | 'TOLL_FREE' | 'MOBILE_VIRTUAL';
      monthlyRent: number;
    },
  ) {
    return this.telephonyService.addNumberToInventory(dto);
  }

  @Post('telephony/numbers/allocate')
  async allocateNumberToTenant(
    @Body() body: { numberId: string; tenantId: string },
  ) {
    return this.telephonyService.allocateNumberToTenant(body.numberId, body.tenantId);
  }

  @Post('telephony/numbers/release')
  async releaseNumberFromTenant(
    @Body() body: { numberId: string },
  ) {
    return this.telephonyService.releaseNumber(body.numberId);
  }

  // ==========================================
  // CLIENT AI SERVICE ALLOCATION & LIMITS
  // ==========================================

  @Put('clients/:id/ai-quota')
  async updateClientAiQuota(
    @Param('id') tenantId: string,
    @Body()
    dto: {
      aiCallingEnabled?: boolean;
      monthlyCallingLimit?: number;
      dailyCallingLimit?: number;
      concurrencyLimit?: number;
      creditAdjustment?: number;
      assignedNumberId?: string;
    },
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Client not found');

    const updateData: any = {};
    if (dto.aiCallingEnabled !== undefined) updateData.aiCallingEnabled = dto.aiCallingEnabled;
    if (dto.monthlyCallingLimit !== undefined) updateData.monthlyCallingLimit = dto.monthlyCallingLimit;
    if (dto.dailyCallingLimit !== undefined) updateData.dailyCallingLimit = dto.dailyCallingLimit;
    if (dto.concurrencyLimit !== undefined) updateData.concurrencyLimit = dto.concurrencyLimit;
    if (dto.creditAdjustment !== undefined && dto.creditAdjustment !== 0) {
      updateData.creditBalance = { increment: dto.creditAdjustment };
    }

    const updated = await (this.prisma as any).tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    if (dto.assignedNumberId) {
      await this.telephonyService.allocateNumberToTenant(dto.assignedNumberId, tenantId);
    }

    if (dto.creditAdjustment !== undefined && dto.creditAdjustment !== 0) {
      await (this.prisma as any).creditTransaction.create({
        data: {
          tenantId,
          type: dto.creditAdjustment > 0 ? 'BONUS' : 'USAGE_DEDUCTION',
          amount: dto.creditAdjustment,
          balanceAfter: Number(updated.creditBalance),
          description: `Admin manual balance adjustment (${dto.creditAdjustment > 0 ? '+' : ''}₹${dto.creditAdjustment})`,
        },
      });
    }

    return updated;
  }

  // ==========================================
  // CENTRALIZED USAGE & BILLING REPORTS
  // ==========================================

  @Get('reports/sarvam-billing')
  async getSarvamBillingReport() {
    const calls = await this.prisma.call.findMany({
      include: { tenant: true },
    });

    const totalMinutes = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0) / 60;
    const providerCost = totalMinutes * 0.95; // Sarvam rate
    const clientBilled = calls.reduce((acc, c) => acc + Number(c.costAmount || 0), 0);
    const grossMargin = clientBilled - providerCost;

    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: { select: { calls: true } },
      },
    });

    const clientWiseUsage = tenants.map((t) => {
      const tenantCalls = calls.filter((c) => c.tenantId === t.id);
      const minutes = tenantCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0) / 60;
      const billed = tenantCalls.reduce((acc, c) => acc + Number(c.costAmount || 0), 0);
      const cost = minutes * 0.95;
      return {
        tenantId: t.id,
        tenantName: t.name,
        totalCalls: tenantCalls.length,
        billableMinutes: parseFloat(minutes.toFixed(2)),
        providerCost: parseFloat(cost.toFixed(2)),
        clientRevenue: parseFloat(billed.toFixed(2)),
        margin: parseFloat((billed - cost).toFixed(2)),
        creditBalance: Number((t as any).creditBalance ?? 450),
        status: t.status,
      };
    });

    return {
      totalCalls: calls.length,
      totalBillableMinutes: parseFloat(totalMinutes.toFixed(2)),
      totalProviderCost: parseFloat(providerCost.toFixed(2)),
      totalClientRevenue: parseFloat(clientBilled.toFixed(2)),
      grossMargin: parseFloat(grossMargin.toFixed(2)),
      grossMarginPercent: clientBilled > 0 ? parseFloat(((grossMargin / clientBilled) * 100).toFixed(1)) : 0,
      clientWiseUsage,
    };
  }
}
