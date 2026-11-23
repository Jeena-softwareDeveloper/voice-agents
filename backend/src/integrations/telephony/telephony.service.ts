import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';

export interface TelephonyNumber {
  id: string;
  number: string;
  country: string;
  region: string;
  type: 'DID_LOCAL' | 'TOLL_FREE' | 'MOBILE_VIRTUAL';
  provider: string;
  monthlyRent: number;
  status: 'AVAILABLE' | 'ASSIGNED' | 'PENDING_KYC' | 'RESERVED';
  assignedTenantId?: string | null;
  renewalDate: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  isByot: boolean;
  active: boolean;
  allocatedAt?: string;
  byotDetails?: {
    sipTrunkHost?: string;
    accountSid?: string;
    carrierName?: string;
  };
}

export interface NumberRequestPayload {
  numberId?: string;
  businessKyc: {
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

  // Managed Number Inventory (Indian telecom circles & TRAI compliant numbers)
  private managedNumbers: TelephonyNumber[] = [
    {
      id: 'num-pune-01',
      number: '+91 20 6955 9944',
      country: 'India',
      region: 'Pune Circle (020)',
      type: 'DID_LOCAL',
      provider: 'Jeenora / Tata Telephony Trunk',
      monthlyRent: 499,
      status: 'ASSIGNED',
      assignedTenantId: 'tenant-jj-real-estate-001',
      renewalDate: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
      kycStatus: 'VERIFIED',
      isByot: false,
      active: true,
      allocatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'num-mumbai-02',
      number: '+91 22 6933 7722',
      country: 'India',
      region: 'Mumbai Circle (022)',
      type: 'DID_LOCAL',
      provider: 'Jeenora / Tata Telephony Trunk',
      monthlyRent: 499,
      status: 'AVAILABLE',
      renewalDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
      kycStatus: 'VERIFIED',
      isByot: false,
      active: true,
    },
    {
      id: 'num-delhi-03',
      number: '+91 11 6944 8833',
      country: 'India',
      region: 'Delhi NCR Circle (011)',
      type: 'DID_LOCAL',
      provider: 'Jeenora / Tata Telephony Trunk',
      monthlyRent: 499,
      status: 'AVAILABLE',
      renewalDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
      kycStatus: 'VERIFIED',
      isByot: false,
      active: true,
    },
    {
      id: 'num-blr-04',
      number: '+91 80 6922 4411',
      country: 'India',
      region: 'Bangalore Circle (080)',
      type: 'DID_LOCAL',
      provider: 'Jeenora / Tata Telephony Trunk',
      monthlyRent: 499,
      status: 'AVAILABLE',
      renewalDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
      kycStatus: 'VERIFIED',
      isByot: false,
      active: true,
    },
    {
      id: 'num-tollfree-05',
      number: '1800 890 3322',
      country: 'India',
      region: 'National Toll-Free (1800)',
      type: 'TOLL_FREE',
      provider: 'Jeenora / Tata Telephony Trunk',
      monthlyRent: 1499,
      status: 'AVAILABLE',
      renewalDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      kycStatus: 'VERIFIED',
      isByot: false,
      active: true,
    },
    {
      id: 'num-mobile-06',
      number: '+91 98100 12345',
      country: 'India',
      region: 'National Virtual Mobile',
      type: 'MOBILE_VIRTUAL',
      provider: 'Jeenora / Tata Telephony Trunk',
      monthlyRent: 699,
      status: 'AVAILABLE',
      renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      kycStatus: 'VERIFIED',
      isByot: false,
      active: true,
    },
  ];

  /**
   * Super Admin: View all numbers in platform inventory
   */
  async getAllNumbers(): Promise<TelephonyNumber[]> {
    return this.managedNumbers;
  }

  /**
   * Client / Onboarding: View unassigned numbers ready for purchase/allocation
   */
  async getAvailableNumbers(): Promise<TelephonyNumber[]> {
    return this.managedNumbers.filter((n) => n.status === 'AVAILABLE');
  }

  /**
   * Client: View current assigned caller ID number for tenant
   */
  async getTenantNumber(tenantId: string): Promise<TelephonyNumber | null> {
    const assigned = this.managedNumbers.find((n) => n.assignedTenantId === tenantId && n.status === 'ASSIGNED');
    return assigned || null;
  }

  /**
   * Client Onboarding Flow: Request or Purchase an eligible phone number
   */
  async requestNumber(tenantId: string, payload: NumberRequestPayload): Promise<TelephonyNumber> {
    if (payload.isByot) {
      // Bring Your Own Telephony Workflow
      const byotRecord: TelephonyNumber = {
        id: `num-byot-${Date.now()}`,
        number: payload.byotDetails?.accountSid || '+91-BYOT-TRUNK',
        country: 'India',
        region: 'Client BYOT Trunk',
        type: 'DID_LOCAL',
        provider: `BYOT (${payload.byotDetails?.carrierName || 'Custom SIP'})`,
        monthlyRent: 0,
        status: 'PENDING_KYC',
        assignedTenantId: tenantId,
        renewalDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        kycStatus: 'PENDING',
        isByot: true,
        active: false,
        byotDetails: payload.byotDetails,
      };
      this.managedNumbers.push(byotRecord);
      this.logger.log(`[Telephony] BYOT Trunk request submitted by tenant: ${tenantId}`);
      return byotRecord;
    }

    if (!payload.numberId) {
      throw new BadRequestException('Please select a valid phone number from the available inventory.');
    }

    const numberRecord = this.managedNumbers.find((n) => n.id === payload.numberId);
    if (!numberRecord) {
      throw new NotFoundException('Selected phone number was not found.');
    }

    if (numberRecord.status !== 'AVAILABLE') {
      throw new BadRequestException('This phone number is no longer available. Please select another.');
    }

    // Mark as pending KYC verification or directly allocated if business KYC is provided
    numberRecord.status = 'ASSIGNED';
    numberRecord.assignedTenantId = tenantId;
    numberRecord.kycStatus = 'VERIFIED';
    numberRecord.allocatedAt = new Date().toISOString();

    this.logger.log(`[Telephony] Number ${numberRecord.number} successfully assigned to tenant: ${tenantId}`);
    return numberRecord;
  }

  /**
   * Super Admin / Provisioning Workflow: Allocate number to tenant
   */
  async allocateNumberToTenant(numberId: string, tenantId: string): Promise<TelephonyNumber> {
    const numberRecord = this.managedNumbers.find((n) => n.id === numberId);
    if (!numberRecord) {
      throw new NotFoundException('Phone number not found.');
    }

    // Unassign any currently active number for this tenant first
    this.managedNumbers.forEach((n) => {
      if (n.assignedTenantId === tenantId && n.id !== numberId) {
        n.status = 'AVAILABLE';
        n.assignedTenantId = undefined;
      }
    });

    numberRecord.status = 'ASSIGNED';
    numberRecord.assignedTenantId = tenantId;
    numberRecord.kycStatus = 'VERIFIED';
    numberRecord.active = true;
    numberRecord.allocatedAt = new Date().toISOString();

    this.logger.log(`[Telephony] Admin allocated number ${numberRecord.number} to tenant ${tenantId}`);
    return numberRecord;
  }

  /**
   * Super Admin: Release number back to available pool
   */
  async releaseNumber(numberId: string): Promise<TelephonyNumber> {
    const numberRecord = this.managedNumbers.find((n) => n.id === numberId);
    if (!numberRecord) {
      throw new NotFoundException('Phone number not found.');
    }

    numberRecord.status = 'AVAILABLE';
    numberRecord.assignedTenantId = undefined;
    numberRecord.allocatedAt = undefined;

    this.logger.log(`[Telephony] Number ${numberRecord.number} released back to pool`);
    return numberRecord;
  }

  /**
   * Super Admin: Add newly provisioned verified number from official Sarvam dashboard/carrier
   */
  async addNumberToInventory(dto: {
    number: string;
    region: string;
    type: 'DID_LOCAL' | 'TOLL_FREE' | 'MOBILE_VIRTUAL';
    monthlyRent: number;
  }): Promise<TelephonyNumber> {
    const exists = this.managedNumbers.some((n) => n.number.replace(/\s+/g, '') === dto.number.replace(/\s+/g, ''));
    if (exists) {
      throw new BadRequestException('A phone number with this caller ID already exists in inventory.');
    }

    const newRecord: TelephonyNumber = {
      id: `num-${Date.now()}`,
      number: dto.number,
      country: 'India',
      region: dto.region,
      type: dto.type,
      provider: 'Jeenora / Tata Telephony Trunk',
      monthlyRent: dto.monthlyRent,
      status: 'AVAILABLE',
      renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      kycStatus: 'VERIFIED',
      isByot: false,
      active: true,
    };

    this.managedNumbers.push(newRecord);
    this.logger.log(`[Telephony] Super Admin added new provisioned number: ${dto.number}`);
    return newRecord;
  }
}
