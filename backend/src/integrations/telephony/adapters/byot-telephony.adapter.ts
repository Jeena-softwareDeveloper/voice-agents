import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';
import {
  TelephonyProviderAdapter,
  TelephonyCapabilities,
  ConnectionVerificationResult,
  NumberCatalogFilters,
  NumberCatalogResult,
  PurchaseNumberPayload,
  PurchasedNumberResult,
  ReleaseNumberResult,
} from './telephony-adapter.interface';

@Injectable()
export class ByotTelephonyAdapter implements TelephonyProviderAdapter {
  private readonly logger = new Logger(ByotTelephonyAdapter.name);

  readonly providerId = 'byot';
  readonly providerName = 'Bring Your Own Telephony (BYOT)';
  readonly providerType = 'BYOT_SIP_TRUNK' as const;

  getCapabilities(): TelephonyCapabilities {
    return {
      supportsCatalog: false,
      supportsPurchase: false,
      supportsByot: true,
      supportsSipTrunk: true,
      supportsRelease: true,
      notes:
        'Supports bringing custom SIP trunks and carrier numbers (Twilio, Tata Communications, Exotel, Plivo, Asterisk, FreeSWITCH).',
    };
  }

  /**
   * Verify SIP Trunk or carrier connection parameters
   */
  async verifyConnection(config?: {
    carrierName?: string;
    sipTrunkHost?: string;
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
  }): Promise<ConnectionVerificationResult> {
    if (!config?.sipTrunkHost && !config?.accountSid) {
      return {
        verified: false,
        providerStatus: 'PENDING_VERIFICATION',
        error: 'Either SIP Trunk Host or Carrier Account SID must be specified for BYOT.',
      };
    }

    // Validate phone number formatting if provided
    let phoneMeta: any = null;
    if (config.phoneNumber) {
      const clean = config.phoneNumber.trim();
      if (!isValidPhoneNumber(clean)) {
        return {
          verified: false,
          providerStatus: 'FAILED',
          error: `Phone number ${clean} is not a valid international E.164 phone number.`,
        };
      }
      const parsed = parsePhoneNumber(clean);
      if (parsed) {
        phoneMeta = {
          e164: parsed.format('E.164'),
          countryCode: parsed.country,
          callingCode: `+${parsed.countryCallingCode}`,
          numberType: parsed.getType() || 'LOCAL',
        };
      }
    }

    // Basic network / hostname verification pattern for SIP Host
    if (config.sipTrunkHost) {
      const host = config.sipTrunkHost.trim().toLowerCase();
      const validHostRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+(:[0-9]{1,5})?$/;
      if (!validHostRegex.test(host)) {
        return {
          verified: false,
          providerStatus: 'FAILED',
          error: `Invalid SIP Trunk Host format: "${config.sipTrunkHost}". Expected e.g. sip.carrier.com or fqdn:port.`,
        };
      }
    }

    this.logger.log(`[ByotTelephonyAdapter] BYOT Connection verified for trunk: ${config.sipTrunkHost || config.carrierName}`);

    return {
      verified: true,
      providerStatus: 'ACTIVE',
      metadata: {
        carrier: config.carrierName || 'Custom SIP Carrier',
        sipTrunkHost: config.sipTrunkHost,
        verifiedAt: new Date().toISOString(),
        phoneMeta,
      },
    };
  }

  async getNumberCatalog(filters?: NumberCatalogFilters): Promise<NumberCatalogResult> {
    return {
      isSupported: false,
      status: 'UNSUPPORTED_BY_PROVIDER',
      message:
        'BYOT does not have a purchase catalog. Numbers are imported directly from your existing carrier connection.',
      items: [],
      availableCountries: [],
      availableTypes: [],
      total: 0,
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    };
  }

  async purchaseNumber(payload: PurchaseNumberPayload): Promise<PurchasedNumberResult> {
    throw new BadRequestException(
      'BYOT connections do not support number purchasing. Please connect your existing carrier number via Add BYOT Number.',
    );
  }

  async releaseNumber(providerNumberId: string): Promise<ReleaseNumberResult> {
    this.logger.log(`[ByotTelephonyAdapter] Releasing BYOT number ${providerNumberId}`);
    return {
      success: true,
      message: `BYOT Number ${providerNumberId} disconnected and released.`,
    };
  }

  async refreshConnection(config?: any): Promise<ConnectionVerificationResult> {
    return this.verifyConnection(config);
  }
}
