import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
  userId: string;
  role: string;
}

export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantContextData>();

  static run(data: TenantContextData, fn: () => any) {
    return this.storage.run(data, fn);
  }

  static get(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  static getTenantId(): string {
    const store = this.storage.getStore();
    if (!store?.tenantId) {
      throw new Error('Tenant context missing: Unauthorized or missing tenant identifier');
    }
    return store.tenantId;
  }
}
