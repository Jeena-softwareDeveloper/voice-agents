import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TenantValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateTenantActive(tenantId: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true, aiCallingEnabled: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Invalid tenant identifier.');
    }

    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException('Tenant account is suspended. Contact Platform Admin.');
    }

    return true;
  }

  async validateUserBelongsToTenant(userId: string, tenantId: string): Promise<boolean> {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('User is not authorized for this tenant workspace.');
    }

    return true;
  }
}
