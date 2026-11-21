import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantValidator } from '../tenancy/tenant-validator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantValidator: TenantValidator) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Platform admin bypasses tenant membership checks
    if (user?.role === 'PLATFORM_ADMIN') {
      return true;
    }

    const tenantId = req.headers['x-tenant-id'] || user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant context.');
    }

    await this.tenantValidator.validateTenantActive(tenantId);

    if (user?.id) {
      await this.tenantValidator.validateUserBelongsToTenant(user.id, tenantId);
    }

    return true;
  }
}
