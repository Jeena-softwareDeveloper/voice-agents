import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TenantContext } from '../tenancy/tenant-context';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;
    if (!tenantId) {
      const fromContext = TenantContext.get()?.tenantId;
      if (fromContext) return fromContext;
      throw new UnauthorizedException('Tenant header x-tenant-id is required.');
    }
    return tenantId;
  },
);
