import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async getTenantCalls(tenantId: string, filters?: { status?: any; outcome?: any; serviceId?: string }) {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.outcome) where.outcome = filters.outcome;
    if (filters?.serviceId) where.serviceId = filters.serviceId;

    return this.prisma.call.findMany({
      where,
      include: {
        lead: {
          include: {
            contact: true,
          },
        },
        service: true,
        usageLedger: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getCallById(tenantId: string, id: string) {
    const call = await this.prisma.call.findFirst({
      where: { id, tenantId },
      include: {
        lead: {
          include: { contact: true },
        },
        service: true,
        serviceAiConfig: true,
        usageLedger: true,
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Call record not found.');
    }

    return call;
  }

  // Admin: View all calls across tenants
  async getAllCallsForAdmin(filters?: { tenantId?: string; status?: any; outcome?: any }) {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;
    if (filters?.outcome) where.outcome = filters.outcome;

    return this.prisma.call.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true } },
        lead: {
          include: { contact: true },
        },
        service: true,
        usageLedger: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
