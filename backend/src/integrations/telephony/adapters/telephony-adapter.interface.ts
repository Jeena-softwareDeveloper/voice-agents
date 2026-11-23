export interface TelephonyCapabilities {
  supportsCatalog: boolean;
  supportsPurchase: boolean;
  supportsByot: boolean;
  supportsSipTrunk: boolean;
  supportsRelease: boolean;
  notes?: string;
}

export interface ConnectionVerificationResult {
  verified: boolean;
  error?: string;
  providerStatus: string;
  metadata?: Record<string, any>;
}

export interface NumberCatalogFilters {
  countryCode?: string;
  numberType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NumberCatalogItem {
  providerNumberId: string;
  e164Number: string;
  countryCode: string;
  countryName: string;
  callingCode: string;
  region?: string;
  numberType: 'LOCAL' | 'TOLL_FREE' | 'MOBILE' | 'NATIONAL';
  monthlyRent?: number;
  currency?: string;
  billingPeriod?: 'MONTHLY' | 'ANNUAL';
  features?: string[];
  kycRequired?: boolean;
}

export interface NumberCatalogResult {
  isSupported: boolean;
  status: 'SUPPORTED' | 'UNSUPPORTED_BY_PROVIDER' | 'ERROR';
  message?: string;
  items: NumberCatalogItem[];
  availableCountries?: Array<{ code: string; name: string; callingCode: string }>;
  availableTypes?: string[];
  total: number;
  page?: number;
  limit?: number;
}

export interface PurchaseNumberPayload {
  providerNumberId: string;
  paymentMethodId?: string;
  businessKyc?: {
    authorizedSignatoryName?: string;
    businessRegistrationNumber?: string;
    address?: string;
  };
}

export interface PurchasedNumberResult {
  success: boolean;
  providerNumberId: string;
  e164Number: string;
  status: string;
  region?: string;
  renewalDate?: Date;
  message?: string;
}

export interface ReleaseNumberResult {
  success: boolean;
  message: string;
}

export interface TelephonyProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly providerType: 'SARVAM_MANAGED' | 'BYOT_SIP_TRUNK' | 'BYOT_CARRIER';

  getCapabilities(): TelephonyCapabilities;
  verifyConnection(config?: any): Promise<ConnectionVerificationResult>;
  getNumberCatalog(filters?: NumberCatalogFilters): Promise<NumberCatalogResult>;
  purchaseNumber(payload: PurchaseNumberPayload): Promise<PurchasedNumberResult>;
  releaseNumber(providerNumberId: string): Promise<ReleaseNumberResult>;
  refreshConnection(config?: any): Promise<ConnectionVerificationResult>;
}
