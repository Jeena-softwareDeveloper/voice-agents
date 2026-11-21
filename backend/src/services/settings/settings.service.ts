import { Injectable } from '@nestjs/common';
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

    const telephonyInventory = await this.telephonyService.getManagedInventory();
    const sarvamStatus = await this.sarvamService.verifyCredentials();
    const voices = this.sarvamService.getAvailableVoices();
    const languages = this.sarvamService.getAvailableLanguages();

    return {
      aiProvider: {
        provider: 'Sarvam AI',
        status: sarvamStatus.status,
        balanceRemaining: sarvamStatus.balanceRemaining,
        baseUrl: settingsMap['sarvam_base_url'] || 'https://api.sarvam.ai/v1',
        apiKeyMasked: 'srv_live_••••••••••••••••••••3fa9',
        voices,
        languages,
      },
      telephony: {
        provider: 'Tata Tele / Sarvam Telephony Trunk',
        managedNumbers: telephonyInventory,
        activeRoutes: 'India (All Circles / TRAI Compliant)',
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
        aiMinuteRateInr: Number(settingsMap['ai_minute_rate'] || 1.5),
        telephonyMinuteRateInr: Number(settingsMap['telephony_minute_rate'] || 0.4),
        platformMarkupPercent: 15,
        gstRatePercent: 18,
      },
    };
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
}
