import { Injectable, Logger } from '@nestjs/common';

export interface TelephonyNumber {
  id: string;
  number: string;
  country: string;
  provider: string;
  status: 'ACTIVE' | 'ASSIGNED' | 'RESERVED';
  assignedTenantId?: string;
}

@Injectable()
export class TelephonyService {
  private readonly logger = new Logger(TelephonyService.name);

  private managedNumbers: TelephonyNumber[] = [
    { id: 'num-1', number: '+919810012345', country: 'IN', provider: 'Sarvam/Tata Tele', status: 'ACTIVE' },
    { id: 'num-2', number: '+919810067890', country: 'IN', provider: 'Sarvam/Tata Tele', status: 'ACTIVE' },
    { id: 'num-3', number: '+919810099887', country: 'IN', provider: 'Sarvam/Tata Tele', status: 'ACTIVE' },
    { id: 'num-4', number: '+919810033221', country: 'IN', provider: 'Sarvam/Tata Tele', status: 'ACTIVE' },
  ];

  async getManagedInventory(): Promise<TelephonyNumber[]> {
    return this.managedNumbers;
  }

  async allocateNumberToTenant(tenantId: string): Promise<TelephonyNumber> {
    const available = this.managedNumbers.find((n) => n.status === 'ACTIVE');
    if (!available) {
      return this.managedNumbers[0];
    }
    available.status = 'ASSIGNED';
    available.assignedTenantId = tenantId;
    return available;
  }
}
