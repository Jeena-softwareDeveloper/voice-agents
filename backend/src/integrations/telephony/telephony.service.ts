import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';
import { PrismaService } from '../../database/prisma.service';
import { SarvamTelephonyAdapter } from './adapters/sarvam-telephony.adapter';
import { ByotTelephonyAdapter } from './adapters/byot-telephony.adapter';
import {
  NumberCatalogFilters,
  NumberCatalogResult,
  PurchaseNumberPayload,
} from './adapters/telephony-adapter.interface';

export interface TelephonyNumberDto {
  id: string;
  e164Number: string;
  number?: string; // backwards compatibility alias for e164Number
  countryCode: string;
  countryName: string;
  callingCode: string;
  region: string;
  numberType: string;
  type?: string; // backwards compatibility alias for numberType
  provider: string;
  monthlyRent: number;
  currency: string;
  status: string;
  providerStatus: string;
  assignedTenantId?: string | null;
  renewalDate: string;
  kycStatus: string;
  isByot: boolean;
  active: boolean;
  allocatedAt?: string | null;
  assignedAgentId?: string | null;
  assignedServiceName?: string | null;
  connectionId?: string | null;
  connectionName?: string | null;
  lastSynchronizedAt?: string;
}

export interface TelephonyConnectionDto {
  id: string;
  name: string;
  providerType: 'SARVAM_MANAGED' | 'BYOT_SIP_TRUNK' | 'BYOT_CARRIER';
  providerName: string;
  status: string;
  isVerified: boolean;
  config?: any;
  lastVerifiedAt?: string | null;
  lastSyncAt?: string | null;
  phoneNumbersCount: number;
  createdAt: string;
}

export interface RegisterByotPayload {
  e164Number: string;
  connectionName?: string;
  carrierName?: string;
  sipTrunkHost?: string;
  accountSid?: string;
  authToken?: string;
  region?: string;
  businessKyc?: {
    authorizedSignatoryName?: string;
    businessRegistrationNumber?: string;
    address?: string;
  };
}

export interface NumberRequestPayload {
  numberId?: string;
  businessKyc?: {
    gstin?: string;
    panNumber?: string;
    registeredAddress?: string;
    authorizedSignatoryName: string;
  };
  isByot?: boolean;
  byotDetails?: {
    carrierName?: string;
    sipTrunkHost?: string;
    accountSid?: string;
  };
}

@Injectable()
export class TelephonyService {
  private readonly logger = new Logger(TelephonyService.name);
  private regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

  constructor(
    private readonly prisma: PrismaService,
    private readonly sarvamAdapter: SarvamTelephonyAdapter,
    private readonly byotAdapter: ByotTelephonyAdapter,
  ) { }

  /**
   * Helper: Derive country name dynamically from ISO 3166-1 alpha-2 code
   */
  private getCountryName(countryCode?: string | null): string {
    if (!countryCode) return 'International';
    try {
      return this.regionNames.of(countryCode.toUpperCase()) || countryCode;
    } catch {
      return countryCode;
    }
  }

  /**
   * Helper: Map Prisma PhoneNumber entity to standardized TelephonyNumberDto
   */
  private mapPhoneNumberToDto(n: any): TelephonyNumberDto {
    const rawNumber = n.e164Number || n.number || '';
    let countryCode = n.countryCode;
    let callingCode = n.callingCode;
    let countryName = n.countryName;
    let numberType = n.numberType || n.type || 'LOCAL';

    // If metadata missing from DB record, compute dynamically via libphonenumber-js
    if (rawNumber && (!countryCode || !callingCode)) {
      try {
        if (isValidPhoneNumber(rawNumber)) {
          const parsed = parsePhoneNumber(rawNumber);
          if (parsed) {
            countryCode = parsed.country || countryCode;
            callingCode = `+${parsed.countryCallingCode}`;
            countryName = this.getCountryName(countryCode);
            numberType = parsed.getType() || numberType;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!countryName && countryCode) {
      countryName = this.getCountryName(countryCode);
    }

    const rent = n.monthlyRent ? Number(n.monthlyRent) : 0;
    const providerStr =
      n.connection?.providerName ||
      (n.isByot ? 'Bring Your Own Telephony (BYOT)' : 'Sarvam Enterprise Telephony');

    return {
      id: n.id,
      e164Number: rawNumber,
      number: rawNumber,
      countryCode: countryCode || 'XX',
      countryName: countryName || 'International',
      callingCode: callingCode || '',
      region: n.region || countryName || 'Global',
      numberType,
      type: numberType,
      provider: providerStr,
      monthlyRent: rent,
      currency: n.currency || 'USD',
      status: n.providerStatus || n.status || 'ACTIVE',
      providerStatus: n.providerStatus || n.status || 'ACTIVE',
      assignedTenantId: n.tenantId,
      renewalDate: n.renewalDate ? n.renewalDate.toISOString() : new Date().toISOString(),
      kycStatus: n.kycStatus || 'NOT_REQUIRED',
      isByot: n.isByot || false,
      active: n.active !== false,
      allocatedAt: n.allocatedAt ? n.allocatedAt.toISOString() : null,
      assignedAgentId: n.assignedAgentId,
      assignedServiceName: n.assignedServiceName,
      connectionId: n.connectionId,
      connectionName: n.connection?.name || null,
      lastSynchronizedAt: n.lastSynchronizedAt ? n.lastSynchronizedAt.toISOString() : new Date().toISOString(),
    };
  }

  // =========================================================================
  // 1. Telephony Connections (Tenant Scoped)
  // =========================================================================

  /**
   * Get all verified telephony connections for a tenant
   */
  async getTenantConnections(tenantId: string): Promise<TelephonyConnectionDto[]> {
    // 1. Check Sarvam provider status dynamically
    const sarvamHealth = await this.sarvamAdapter.verifyConnection();

    // 2. Query tenant connections from database
    const dbConnections = await this.prisma.telephonyConnection.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { phoneNumbers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: TelephonyConnectionDto[] = dbConnections.map((c) => ({
      id: c.id,
      name: c.name,
      providerType: c.providerType as any,
      providerName: c.providerName,
      status: c.status,
      isVerified: c.isVerified,
      config: c.config,
      lastVerifiedAt: c.lastVerifiedAt?.toISOString() || null,
      lastSyncAt: c.lastSyncAt?.toISOString() || null,
      phoneNumbersCount: c._count.phoneNumbers,
      createdAt: c.createdAt.toISOString(),
    }));

    // 3. Ensure Sarvam connection appears if verified and not already registered in DB
    const hasSarvamInDb = results.some((c) => c.providerType === 'SARVAM_MANAGED');
    if (!hasSarvamInDb && sarvamHealth.verified) {
      // Upsert Sarvam connection record for this tenant
      const sarvamRecord = await this.prisma.telephonyConnection.create({
        data: {
          tenantId,
          name: 'Sarvam Enterprise Telephony',
          providerType: 'SARVAM_MANAGED',
          providerName: 'Sarvam Enterprise Telephony',
          status: 'VERIFIED',
          isVerified: true,
          config: sarvamHealth.metadata || {},
          lastVerifiedAt: new Date(),
          lastSyncAt: new Date(),
        },
      });

      results.unshift({
        id: sarvamRecord.id,
        name: sarvamRecord.name,
        providerType: 'SARVAM_MANAGED',
        providerName: sarvamRecord.providerName,
        status: sarvamRecord.status,
        isVerified: sarvamRecord.isVerified,
        config: sarvamRecord.config,
        lastVerifiedAt: sarvamRecord.lastVerifiedAt?.toISOString() || null,
        lastSyncAt: sarvamRecord.lastSyncAt?.toISOString() || null,
        phoneNumbersCount: 0,
        createdAt: sarvamRecord.createdAt.toISOString(),
      });
    }

    return results;
  }

  /**
   * Add a new Telephony Connection (e.g. BYOT SIP Trunk / Carrier)
   */
  async addConnection(
    tenantId: string,
    payload: {
      name: string;
      providerType: 'SARVAM_MANAGED' | 'BYOT_SIP_TRUNK' | 'BYOT_CARRIER';
      carrierName?: string;
      sipTrunkHost?: string;
      accountSid?: string;
      authToken?: string;
    },
  ): Promise<TelephonyConnectionDto> {
    if (!payload.name?.trim()) {
      throw new BadRequestException('A connection name is required.');
    }

    let verificationResult;
    if (payload.providerType === 'SARVAM_MANAGED') {
      verificationResult = await this.sarvamAdapter.verifyConnection();
    } else {
      verificationResult = await this.byotAdapter.verifyConnection({
        carrierName: payload.carrierName,
        sipTrunkHost: payload.sipTrunkHost,
        accountSid: payload.accountSid,
      });
    }

    if (!verificationResult.verified) {
      throw new BadRequestException(
        `Connection verification failed: ${verificationResult.error || 'Invalid credentials or host unreachable.'}`,
      );
    }

    const providerName =
      payload.providerType === 'SARVAM_MANAGED'
        ? 'Sarvam Enterprise Telephony'
        : payload.carrierName || 'Custom SIP Carrier';

    const connection = await this.prisma.telephonyConnection.create({
      data: {
        tenantId,
        name: payload.name.trim(),
        providerType: payload.providerType,
        providerName,
        status: verificationResult.providerStatus || 'VERIFIED',
        isVerified: verificationResult.verified,
        config: {
          sipTrunkHost: payload.sipTrunkHost,
          accountSid: payload.accountSid ? `${payload.accountSid.substring(0, 4)}••••` : undefined,
          carrierName: payload.carrierName,
        },
        lastVerifiedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    this.logger.log(`[Telephony] New connection created: ${connection.id} for tenant: ${tenantId}`);

    return {
      id: connection.id,
      name: connection.name,
      providerType: connection.providerType as any,
      providerName: connection.providerName,
      status: connection.status,
      isVerified: connection.isVerified,
      config: connection.config,
      lastVerifiedAt: connection.lastVerifiedAt?.toISOString() || null,
      lastSyncAt: connection.lastSyncAt?.toISOString() || null,
      phoneNumbersCount: 0,
      createdAt: connection.createdAt.toISOString(),
    };
  }

  /**
   * Refresh and re-verify connection
   */
  async refreshConnection(tenantId: string, connectionId: string): Promise<TelephonyConnectionDto> {
    const connection = await this.prisma.telephonyConnection.findFirst({
      where: { id: connectionId, tenantId },
      include: { _count: { select: { phoneNumbers: true } } },
    });

    if (!connection) {
      throw new NotFoundException('Telephony connection not found.');
    }

    let result;
    if (connection.providerType === 'SARVAM_MANAGED') {
      result = await this.sarvamAdapter.verifyConnection();
    } else {
      result = await this.byotAdapter.verifyConnection(connection.config as any);
    }

    const updated = await this.prisma.telephonyConnection.update({
      where: { id: connectionId },
      data: {
        status: result.verified ? 'VERIFIED' : 'ERROR',
        isVerified: result.verified,
        lastVerifiedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      providerType: updated.providerType as any,
      providerName: updated.providerName,
      status: updated.status,
      isVerified: updated.isVerified,
      config: updated.config,
      lastVerifiedAt: updated.lastVerifiedAt?.toISOString() || null,
      lastSyncAt: updated.lastSyncAt?.toISOString() || null,
      phoneNumbersCount: connection._count.phoneNumbers,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // =========================================================================
  // 2. Dynamic Number Catalog (Provider & Database Driven)
  // =========================================================================

  /**
   * Browse available numbers for rental from provider or unallocated inventory
   */
  async getNumberCatalog(
    tenantId: string,
    filters?: NumberCatalogFilters,
  ): Promise<NumberCatalogResult> {
    // 1. Query Sarvam adapter
    const providerCatalog = await this.sarvamAdapter.getNumberCatalog(filters);

    // 2. Also check if there are unassigned numbers available in the platform database
    const availableDbNumbers = await this.prisma.phoneNumber.findMany({
      where: {
        tenantId: null,
        providerStatus: 'AVAILABLE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (availableDbNumbers.length > 0) {
      const dbCatalogItems = availableDbNumbers.map((n) => {
        const dto = this.mapPhoneNumberToDto(n);
        return {
          providerNumberId: n.providerNumberId || n.id,
          e164Number: dto.e164Number,
          countryCode: dto.countryCode,
          countryName: dto.countryName,
          callingCode: dto.callingCode,
          region: dto.region,
          numberType: (dto.numberType as any) || 'LOCAL',
          monthlyRent: dto.monthlyRent,
          currency: dto.currency,
          billingPeriod: 'MONTHLY' as const,
          features: ['Voice Calling', 'SIP Trunking'],
        };
      });

      // Filter by countryCode if provided
      let filtered = dbCatalogItems;
      if (filters?.countryCode) {
        filtered = filtered.filter(
          (item) => item.countryCode.toLowerCase() === filters.countryCode?.toLowerCase(),
        );
      }
      if (filters?.numberType) {
        filtered = filtered.filter(
          (item) => item.numberType.toLowerCase() === filters.numberType?.toLowerCase(),
        );
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.e164Number.toLowerCase().includes(q) ||
            item.countryName.toLowerCase().includes(q) ||
            item.region?.toLowerCase().includes(q),
        );
      }

      // Collect available country filters dynamically from actual data
      const countriesMap = new Map<string, { code: string; name: string; callingCode: string }>();
      dbCatalogItems.forEach((item) => {
        if (!countriesMap.has(item.countryCode)) {
          countriesMap.set(item.countryCode, {
            code: item.countryCode,
            name: item.countryName,
            callingCode: item.callingCode,
          });
        }
      });

      const typesSet = new Set<string>();
      dbCatalogItems.forEach((item) => typesSet.add(item.numberType));

      return {
        isSupported: true,
        status: 'SUPPORTED',
        items: filtered,
        availableCountries: Array.from(countriesMap.values()),
        availableTypes: Array.from(typesSet),
        total: filtered.length,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
      };
    }

    return providerCatalog;
  }

  // =========================================================================
  // 3. Active Caller IDs & Number Management (Tenant Scoped)
  // =========================================================================

  /**
   * Get all active Caller ID numbers owned by the tenant
   */
  async getTenantNumbers(tenantId: string): Promise<TelephonyNumberDto[]> {
    const numbers = await this.prisma.phoneNumber.findMany({
      where: {
        tenantId,
        providerStatus: { not: 'ARCHIVED' },
      },
      include: {
        connection: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return numbers.map((n) => this.mapPhoneNumberToDto(n));
  }

  /**
   * Get single number details with verification
   */
  async getNumberDetails(tenantId: string, numberId: string): Promise<TelephonyNumberDto> {
    const number = await this.prisma.phoneNumber.findFirst({
      where: {
        id: numberId,
        tenantId,
      },
      include: { connection: true },
    });

    if (!number) {
      throw new NotFoundException('Phone number not found or access denied.');
    }

    return this.mapPhoneNumberToDto(number);
  }

  /**
   * Register a Bring Your Own Telephony (BYOT) Number
   */
  async registerByotNumber(
    tenantId: string,
    payload: RegisterByotPayload,
  ): Promise<TelephonyNumberDto> {
    const rawNumber = payload.e164Number?.trim();
    if (!rawNumber) {
      throw new BadRequestException('A valid phone number is required.');
    }

    // Validate international E.164 phone number using libphonenumber-js
    if (!isValidPhoneNumber(rawNumber)) {
      throw new BadRequestException(
        `Invalid phone number format: "${rawNumber}". Must be a valid international phone number in E.164 format (e.g. +1 415 555 2671, +44 20 7183 8750, +91 98220 11223).`,
      );
    }

    const parsed = parsePhoneNumber(rawNumber);
    if (!parsed) {
      throw new BadRequestException('Could not parse phone number metadata.');
    }

    const e164 = parsed.format('E.164');
    const countryCode = parsed.country || 'XX';
    const countryName = this.getCountryName(countryCode);
    const callingCode = `+${parsed.countryCallingCode}`;
    const numberType = parsed.getType() || 'LOCAL';

    // Verify SIP Trunk details
    const verifyRes = await this.byotAdapter.verifyConnection({
      carrierName: payload.carrierName,
      sipTrunkHost: payload.sipTrunkHost,
      accountSid: payload.accountSid,
      phoneNumber: e164,
    });

    if (!verifyRes.verified) {
      throw new BadRequestException(verifyRes.error || 'BYOT verification failed.');
    }

    // Find or create BYOT Telephony Connection for this tenant
    let connection = await this.prisma.telephonyConnection.findFirst({
      where: {
        tenantId,
        providerType: 'BYOT_SIP_TRUNK',
      },
    });

    if (!connection) {
      connection = await this.prisma.telephonyConnection.create({
        data: {
          tenantId,
          name: payload.connectionName || `${payload.carrierName || 'Custom'} SIP Trunk`,
          providerType: 'BYOT_SIP_TRUNK',
          providerName: payload.carrierName || 'BYOT Carrier',
          status: 'VERIFIED',
          isVerified: true,
          config: {
            sipTrunkHost: payload.sipTrunkHost,
            accountSid: payload.accountSid ? `${payload.accountSid.substring(0, 4)}••••` : undefined,
          },
          lastVerifiedAt: new Date(),
          lastSyncAt: new Date(),
        },
      });
    }

    // Check if number already registered
    const existing = await this.prisma.phoneNumber.findFirst({
      where: { e164Number: e164 },
    });

    if (existing && existing.tenantId && existing.tenantId !== tenantId) {
      throw new ForbiddenException('This phone number is already registered to another tenant account.');
    }

    const providerNumberId = `byot_${e164.replace(/[^0-9]/g, '')}`;

    const record = await this.prisma.phoneNumber.upsert({
      where: { e164Number: e164 },
      update: {
        tenantId,
        connectionId: connection.id,
        countryCode,
        countryName,
        callingCode,
        region: payload.region || `${countryName} Carrier Trunk`,
        numberType,
        providerStatus: 'ACTIVE',
        kycStatus: payload.businessKyc?.authorizedSignatoryName ? 'VERIFIED' : 'NOT_REQUIRED',
        isByot: true,
        active: true,
        allocatedAt: new Date(),
        lastSynchronizedAt: new Date(),
      },
      create: {
        tenantId,
        connectionId: connection.id,
        providerNumberId,
        e164Number: e164,
        countryCode,
        countryName,
        callingCode,
        region: payload.region || `${countryName} Carrier Trunk`,
        numberType,
        providerStatus: 'ACTIVE',
        kycStatus: payload.businessKyc?.authorizedSignatoryName ? 'VERIFIED' : 'NOT_REQUIRED',
        monthlyRent: 0,
        currency: 'USD',
        renewalDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        isByot: true,
        active: true,
        allocatedAt: new Date(),
        lastSynchronizedAt: new Date(),
      },
      include: { connection: true },
    });

    this.logger.log(`[Telephony] BYOT Number registered: ${e164} for tenant: ${tenantId}`);

    return this.mapPhoneNumberToDto(record);
  }

  /**
   * Purchase / Rent Number from catalog
   */
  async purchaseNumber(
    tenantId: string,
    payload: PurchaseNumberPayload,
  ): Promise<TelephonyNumberDto> {
    const catalogItem = await this.prisma.phoneNumber.findFirst({
      where: {
        OR: [{ providerNumberId: payload.providerNumberId }, { id: payload.providerNumberId }],
        tenantId: null,
      },
      include: { connection: true },
    });

    if (!catalogItem) {
      // Purchase directly from Sarvam provider adapter
      const purchased = await this.sarvamAdapter.purchaseNumber(payload);

      // Find or create Sarvam Telephony Connection for tenant
      let sarvamConn = await this.prisma.telephonyConnection.findFirst({
        where: {
          tenantId,
          providerType: 'SARVAM_MANAGED',
        },
      });

      if (!sarvamConn) {
        sarvamConn = await this.prisma.telephonyConnection.create({
          data: {
            tenantId,
            name: 'Sarvam Enterprise Telephony',
            providerType: 'SARVAM_MANAGED',
            providerName: 'Sarvam Enterprise Telephony',
            status: 'VERIFIED',
            isVerified: true,
            lastVerifiedAt: new Date(),
            lastSyncAt: new Date(),
          },
        });
      }

      // Upsert the purchased number in DB
      const record = await this.prisma.phoneNumber.upsert({
        where: { e164Number: purchased.e164Number },
        update: {
          tenantId,
          connectionId: sarvamConn.id,
          providerNumberId: purchased.providerNumberId,
          region: purchased.region || 'India',
          providerStatus: 'ACTIVE',
          kycStatus: 'VERIFIED',
          monthlyRent: 59.0,
          currency: 'INR',
          renewalDate: purchased.renewalDate || new Date(Date.now() + 30 * 24 * 3600 * 1000),
          isByot: false,
          active: true,
          allocatedAt: new Date(),
          lastSynchronizedAt: new Date(),
        },
        create: {
          tenantId,
          connectionId: sarvamConn.id,
          providerNumberId: purchased.providerNumberId,
          e164Number: purchased.e164Number,
          countryCode: 'IN',
          countryName: 'India',
          callingCode: '+91',
          region: purchased.region || 'India',
          numberType: 'DID_LOCAL',
          providerStatus: 'ACTIVE',
          kycStatus: 'VERIFIED',
          monthlyRent: 59.0,
          currency: 'INR',
          renewalDate: purchased.renewalDate || new Date(Date.now() + 30 * 24 * 3600 * 1000),
          isByot: false,
          active: true,
          allocatedAt: new Date(),
          lastSynchronizedAt: new Date(),
        },
        include: { connection: true },
      });

      this.logger.log(`[Telephony] Sarvam number ${purchased.e164Number} purchased and assigned to tenant: ${tenantId}`);
      return this.mapPhoneNumberToDto(record);
    }

    // Allocate to tenant
    const updated = await this.prisma.phoneNumber.update({
      where: { id: catalogItem.id },
      data: {
        tenantId,
        providerStatus: 'ACTIVE',
        kycStatus: payload.businessKyc?.authorizedSignatoryName ? 'VERIFIED' : 'PENDING',
        allocatedAt: new Date(),
        lastSynchronizedAt: new Date(),
      },
      include: { connection: true },
    });

    return this.mapPhoneNumberToDto(updated);
  }

  /**
   * Assign number to a specific voice agent or service campaign
   */
  async assignNumber(
    tenantId: string,
    numberId: string,
    payload: { agentId?: string; serviceName?: string },
  ): Promise<TelephonyNumberDto> {
    const number = await this.prisma.phoneNumber.findFirst({
      where: { id: numberId, tenantId },
    });

    if (!number) {
      throw new NotFoundException('Phone number not found.');
    }

    const updated = await this.prisma.phoneNumber.update({
      where: { id: numberId },
      data: {
        assignedAgentId: payload.agentId || null,
        assignedServiceName: payload.serviceName || null,
        lastSynchronizedAt: new Date(),
      },
      include: { connection: true },
    });

    return this.mapPhoneNumberToDto(updated);
  }

  /**
   * Check whether a number is in active use prior to release
   */
  async checkNumberUsage(
    tenantId: string,
    numberId: string,
  ): Promise<{ inUse: boolean; activeDeployments: string[] }> {
    const number = await this.prisma.phoneNumber.findFirst({
      where: { id: numberId, tenantId },
    });

    if (!number) {
      throw new NotFoundException('Phone number not found.');
    }

    const activeDeployments: string[] = [];

    if (number.assignedServiceName) {
      activeDeployments.push(`Assigned as primary caller ID for service: "${number.assignedServiceName}"`);
    }

    // Check recent in-progress calls
    const inProgressCalls = await this.prisma.call.count({
      where: {
        tenantId,
        callerNumber: number.e164Number,
        status: 'IN_PROGRESS',
      },
    });

    if (inProgressCalls > 0) {
      activeDeployments.push(`Currently routing ${inProgressCalls} active in-progress telephony call(s).`);
    }

    return {
      inUse: activeDeployments.length > 0,
      activeDeployments,
    };
  }

  /**
   * Release / Detach a phone number with usage safety check
   */
  async releaseNumber(
    tenantIdOrNumberId: string,
    numberIdOrForce?: string | boolean,
    force: boolean = false,
  ): Promise<{ success: boolean; message: string }> {
    let tenantId: string | null = null;
    let numberId = tenantIdOrNumberId;
    let isForced = force;

    if (typeof numberIdOrForce === 'string') {
      tenantId = tenantIdOrNumberId;
      numberId = numberIdOrForce;
      isForced = force;
    } else if (typeof numberIdOrForce === 'boolean') {
      isForced = numberIdOrForce;
    }

    const number = await this.prisma.phoneNumber.findFirst({
      where: {
        id: numberId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: { connection: true },
    });

    if (!number) {
      throw new NotFoundException('Phone number not found or not owned by your account.');
    }

    // Pre-release usage verification
    if (!isForced && tenantId) {
      const usage = await this.checkNumberUsage(tenantId, numberId);
      if (usage.inUse) {
        throw new BadRequestException(
          `Cannot release number: Active deployments found: ${usage.activeDeployments.join('; ')}. Reassign your services first or confirm force release.`,
        );
      }
    }

    // Provider release call
    if (number.isByot) {
      await this.byotAdapter.releaseNumber(number.providerNumberId || number.e164Number);
    } else {
      await this.sarvamAdapter.releaseNumber(number.providerNumberId || number.e164Number);
    }

    // Update DB record to ARCHIVED / unassigned
    await this.prisma.phoneNumber.update({
      where: { id: numberId },
      data: {
        providerStatus: 'ARCHIVED',
        tenantId: null,
        assignedAgentId: null,
        assignedServiceName: null,
        active: false,
        lastSynchronizedAt: new Date(),
      },
    });

    this.logger.log(`[Telephony] Number ${number.e164Number} released`);

    return {
      success: true,
      message: `Phone number ${number.e164Number} was successfully released.`,
    };
  }

  // =========================================================================
  // 4. Backward Compatibility Interface Methods
  // =========================================================================

  async getTenantNumber(tenantId: string): Promise<any | null> {
    const active = await this.prisma.phoneNumber.findFirst({
      where: { tenantId, providerStatus: 'ACTIVE' },
      include: { connection: true },
    });
    if (!active) return null;
    return this.mapPhoneNumberToDto(active);
  }

  async getAvailableNumbers(): Promise<any[]> {
    return [
      {
        id: 'sarvam_did_7965861204',
        number: '+917965861204',
        country: 'India',
        region: 'Gujarat',
        type: 'LOCAL',
        provider: 'Sarvam Enterprise Telephony',
        monthlyRent: 59,
        status: 'AVAILABLE',
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        kycStatus: 'VERIFIED',
        isByot: false,
        active: true,
      },
      {
        id: 'sarvam_did_7971414538',
        number: '+917971414538',
        country: 'India',
        region: 'Gujarat',
        type: 'LOCAL',
        provider: 'Sarvam Enterprise Telephony',
        monthlyRent: 59,
        status: 'AVAILABLE',
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        kycStatus: 'VERIFIED',
        isByot: false,
        active: true,
      },
      {
        id: 'sarvam_did_8064264313',
        number: '+918064264313',
        country: 'India',
        region: 'Karnataka',
        type: 'LOCAL',
        provider: 'Sarvam Enterprise Telephony',
        monthlyRent: 59,
        status: 'AVAILABLE',
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        kycStatus: 'VERIFIED',
        isByot: false,
        active: true,
      },
    ];
  }

  async getAllNumbers(): Promise<any[]> {
    const all = await this.prisma.phoneNumber.findMany({
      include: { connection: true },
      orderBy: { createdAt: 'desc' },
    });
    return all.map((n) => this.mapPhoneNumberToDto(n));
  }

  async requestNumber(tenantId: string, payload: NumberRequestPayload): Promise<any> {
    if (payload.isByot) {
      const byotNum = payload.byotDetails?.accountSid || '+1-BYOT-TRUNK';
      return this.registerByotNumber(tenantId, {
        e164Number: byotNum,
        carrierName: payload.byotDetails?.carrierName,
        sipTrunkHost: payload.byotDetails?.sipTrunkHost,
        accountSid: payload.byotDetails?.accountSid,
      });
    }

    if (!payload.numberId) {
      throw new BadRequestException('Please select a valid number.');
    }

    return this.purchaseNumber(tenantId, {
      providerNumberId: payload.numberId,
      businessKyc: payload.businessKyc,
    });
  }

  async allocateNumberToTenant(numberId: string, tenantId: string): Promise<any> {
    const number = await this.prisma.phoneNumber.findUnique({
      where: { id: numberId },
    });
    if (!number) throw new NotFoundException('Number not found.');

    const updated = await this.prisma.phoneNumber.update({
      where: { id: numberId },
      data: {
        tenantId,
        providerStatus: 'ACTIVE',
        allocatedAt: new Date(),
        lastSynchronizedAt: new Date(),
      },
      include: { connection: true },
    });
    return this.mapPhoneNumberToDto(updated);
  }

  async addNumberToInventory(dto: {
    number: string;
    region?: string;
    type?: string;
    monthlyRent?: number;
  }): Promise<any> {
    const raw = dto.number.trim();
    let countryCode = 'XX';
    let countryName = 'International';
    let callingCode = '';
    let numberType = dto.type || 'LOCAL';

    try {
      if (isValidPhoneNumber(raw)) {
        const parsed = parsePhoneNumber(raw);
        if (parsed) {
          countryCode = parsed.country || countryCode;
          callingCode = `+${parsed.countryCallingCode}`;
          countryName = this.getCountryName(countryCode);
          numberType = parsed.getType() || numberType;
        }
      }
    } catch {
      // ignore
    }

    const created = await this.prisma.phoneNumber.create({
      data: {
        providerNumberId: `prov_${raw.replace(/[^0-9]/g, '')}`,
        e164Number: raw,
        countryCode,
        countryName,
        callingCode,
        region: dto.region || countryName,
        numberType,
        providerStatus: 'AVAILABLE',
        monthlyRent: dto.monthlyRent || 0,
        currency: 'USD',
        isByot: false,
        active: true,
        lastSynchronizedAt: new Date(),
      },
    });

    return this.mapPhoneNumberToDto(created);
  }
}
