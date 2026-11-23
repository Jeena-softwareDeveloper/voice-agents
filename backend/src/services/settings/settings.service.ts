import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TelephonyService } from '../../integrations/telephony/telephony.service';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';
import { UpdateGlobalSettingsDto, UpdateTenantCallingSettingsDto } from '../../dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private telephonyService: TelephonyService,
    private sarvamService: SarvamService,
  ) {}

  async getPlatformSettings() {
    const rawSettings = await this.prisma.globalSetting.findMany();
    const settingsMap: Record<string, string> = {};
    rawSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const telephonyInventory = await this.telephonyService.getAllNumbers();
    const sarvamStatus = await this.sarvamService.verifyCredentials();

    const providerMinuteCost = 0.95;
    const clientSellingPrice = Number(settingsMap['ai_minute_rate'] || 1.8);
    const platformMargin = parseFloat((((clientSellingPrice - providerMinuteCost) / clientSellingPrice) * 100).toFixed(1));

    return {
      aiProvider: {
        provider: 'Sarvam AI',
        status: sarvamStatus.status,
        latencyMs: sarvamStatus.latencyMs,
        balanceRemaining: sarvamStatus.availableCredits ?? 0,
        runtimeEndpoint: 'Official Sarvam App Runtime (apps.sarvam.ai)',
        apiKeyMasked: this.sarvamService.getMaskedKey(),
        activeModel: sarvamStatus.activeModel || 'Sarvam Voice Agents (Saaras v4 + Bulbul V4)',
        lastCheckedAt: sarvamStatus.lastCheckedAt,
        voices: [],
        languages: [],
      },
      telephony: {
        provider: 'Tata Tele / Sarvam Telephony Trunk',
        managedNumbers: telephonyInventory,
        activeRoutes: 'India (All Circles / TRAI Compliant)',
        totalNumbers: telephonyInventory.length,
        availableNumbers: telephonyInventory.filter((n) => n.status === 'AVAILABLE').length,
        assignedNumbers: telephonyInventory.filter((n) => n.status === 'ASSIGNED').length,
      },
      callingRules: {
        defaultStartHour: Number(settingsMap['calling_start_hour'] || 9),
        defaultEndHour: Number(settingsMap['calling_end_hour'] || 20),
        concurrencyLimit: Number(settingsMap['concurrency_limit'] || 50),
        defaultLanguage: settingsMap['default_language'] || 'hi-IN',
        maxRetries: 3,
        retryDelayHours: 2,
      },
      pricing: {
        providerMinuteCostInr: providerMinuteCost,
        aiMinuteRateInr: clientSellingPrice,
        telephonyMinuteRateInr: Number(settingsMap['telephony_minute_rate'] || 0.4),
        platformMarkupPercent: platformMargin,
        gstRatePercent: 18,
        numberRentalMonthlyInr: 499,
      },
    };
  }

  async testSarvamConnection() {
    return this.sarvamService.verifyCredentials();
  }

  async getSarvamLogs() {
    return this.sarvamService.getProviderAuditLogs();
  }

  async updatePlatformSettings(dto: UpdateGlobalSettingsDto) {
    const upserts = [];
    if (dto.sarvamApiBaseUrl) {
      upserts.push(
        this.prisma.globalSetting.upsert({
          where: { key: 'sarvam_base_url' },
          create: { key: 'sarvam_base_url', value: dto.sarvamApiBaseUrl, category: 'AI_PROVIDER' },
          update: { value: dto.sarvamApiBaseUrl },
        }),
      );
    }
    if (dto.aiMinutePricing !== undefined) {
      upserts.push(
        this.prisma.globalSetting.upsert({
          where: { key: 'ai_minute_rate' },
          create: { key: 'ai_minute_rate', value: dto.aiMinutePricing.toString(), category: 'PRICING' },
          update: { value: dto.aiMinutePricing.toString() },
        }),
      );
    }
    if (dto.defaultCallingStartHour !== undefined) {
      upserts.push(
        this.prisma.globalSetting.upsert({
          where: { key: 'calling_start_hour' },
          create: { key: 'calling_start_hour', value: dto.defaultCallingStartHour.toString(), category: 'CALLING_RULES' },
          update: { value: dto.defaultCallingStartHour.toString() },
        }),
      );
    }
    if (dto.defaultCallingEndHour !== undefined) {
      upserts.push(
        this.prisma.globalSetting.upsert({
          where: { key: 'calling_end_hour' },
          create: { key: 'calling_end_hour', value: dto.defaultCallingEndHour.toString(), category: 'CALLING_RULES' },
          update: { value: dto.defaultCallingEndHour.toString() },
        }),
      );
    }

    if (upserts.length > 0) {
      await this.prisma.$transaction(upserts);
    }

    return this.getPlatformSettings();
  }

  async getTenantCallingSettings(tenantId: string) {
    return this.prisma.tenantCallingSetting.findUnique({
      where: { tenantId },
    });
  }

  async updateTenantCallingSettings(tenantId: string, dto: UpdateTenantCallingSettingsDto) {
    return this.prisma.tenantCallingSetting.upsert({
      where: { tenantId },
      create: {
        tenantId,
        startHour: dto.startHour || 9,
        endHour: dto.endHour || 20,
        maxDailyCalls: dto.maxDailyCalls || 500,
        maxRetries: dto.maxRetries || 3,
        isAutomatedCallingEnabled: dto.isAutomatedCallingEnabled !== undefined ? dto.isAutomatedCallingEnabled : true,
      },
      update: {
        startHour: dto.startHour,
        endHour: dto.endHour,
        maxDailyCalls: dto.maxDailyCalls,
        maxRetries: dto.maxRetries,
        isAutomatedCallingEnabled: dto.isAutomatedCallingEnabled,
      },
    });
  }

  async getCompanyProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { businessProfile: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }
    return {
      id: tenant.id,
      companyName: tenant.businessProfile?.businessName || tenant.name,
      registeredName: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      website: tenant.businessProfile?.website || '',
      address: tenant.businessProfile?.address || '',
      city: tenant.city || '',
      state: tenant.state || '',
      country: tenant.country || 'India',
      businessType: tenant.businessProfile?.category || tenant.businessType || 'Enterprise Services',
      status: tenant.status,
    };
  }

  async updateCompanyProfile(
    tenantId: string,
    dto: {
      companyName: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      city?: string;
      state?: string;
      businessType?: string;
    },
  ) {
    if (!dto.companyName || !dto.companyName.trim()) {
      throw new BadRequestException('Company name cannot be empty.');
    }

    const trimmedName = dto.companyName.trim();

    // 1. Update tenant record
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: trimmedName,
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.city ? { city: dto.city } : {}),
        ...(dto.state ? { state: dto.state } : {}),
        ...(dto.businessType ? { businessType: dto.businessType } : {}),
      },
    });

    // 2. Upsert business profile
    await this.prisma.tenantBusinessProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
        businessName: trimmedName,
        category: dto.businessType || 'Enterprise Services',
        description: '',
        website: dto.website || '',
        address: dto.address || '',
      },
      update: {
        businessName: trimmedName,
        website: dto.website || '',
        address: dto.address || '',
        ...(dto.businessType ? { category: dto.businessType } : {}),
      },
    });

    // 3. Flag existing agent configurations as outdated for change detection
    try {
      await (this.prisma as any).tenantAgentConfiguration.updateMany({
        where: { tenantId, status: { in: ['APPROVED', 'PUBLISHED'] } },
        data: {
          isOutdated: true,
          outdatedReason: 'Company profile details were modified. Review and regenerate AI instructions.',
        },
      });
    } catch {}

    return this.getCompanyProfile(tenantId);
  }
}
