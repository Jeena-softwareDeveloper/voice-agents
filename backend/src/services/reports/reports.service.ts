import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTenantReport(tenantId: string) {
    // 1. Service-wise Leads and Calls
    const services = await this.prisma.service.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { leads: true, calls: true, customers: true },
        },
      },
    });

    // 2. Aggregated Call Stats
    const totalCalls = await this.prisma.call.count({ where: { tenantId } });
    const connectedCalls = await this.prisma.call.count({
      where: {
        tenantId,
        outcome: { in: ['ANSWERED', 'INTERESTED', 'QUALIFIED', 'CALLBACK_REQUESTED', 'DEMO_REQUESTED'] },
      },
    });
    const qualifiedLeads = await this.prisma.lead.count({
      where: { tenantId, status: 'QUALIFIED' },
    });
    const interestedCustomers = await this.prisma.lead.count({
      where: { tenantId, status: 'INTERESTED' },
    });
    const wonCustomers = await this.prisma.customer.count({ where: { tenantId } });
    const totalLeads = await this.prisma.lead.count({ where: { tenantId } });

    // 3. Billable Minutes
    const usage = await this.prisma.aiUsageLedger.aggregate({
      where: { tenantId },
      _sum: { billableMinutes: true, billedToClient: true },
    });

    const conversionRate = totalLeads > 0 ? parseFloat(((wonCustomers / totalLeads) * 100).toFixed(1)) : 0;

    return {
      totalLeads,
      totalCalls,
      connectedCalls,
      qualifiedLeads,
      interestedCustomers,
      convertedCustomers: wonCustomers,
      conversionRate,
      aiCallingMinutes: Number(usage._sum.billableMinutes || 0),
      totalCallingCharges: Number(usage._sum.billedToClient || 0),
      serviceBreakdown: services.map((s) => ({
        serviceId: s.id,
        serviceName: s.name,
        category: s.category,
        totalLeads: s._count.leads,
        totalCalls: s._count.calls,
        converted: s._count.customers,
      })),
    };
  }

  async getPlatformDashboard() {
    const totalClients = await this.prisma.tenant.count();
    const activeClients = await this.prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const pendingOnboarding = await this.prisma.tenant.count({ where: { status: 'PENDING' } });
    const totalLeads = await this.prisma.lead.count();
    const totalCalls = await this.prisma.call.count();
    const connectedCalls = await this.prisma.call.count({
      where: { outcome: { in: ['ANSWERED', 'QUALIFIED', 'INTERESTED', 'CALLBACK_REQUESTED'] } },
    });
    const failedCalls = await this.prisma.call.count({ where: { status: 'FAILED' } });

    const usageAgg = await this.prisma.aiUsageLedger.aggregate({
      _sum: { billableMinutes: true, providerCost: true, billedToClient: true },
    });

    const invoicesAgg = await this.prisma.invoice.aggregate({
      _sum: { totalAmount: true, amountPaid: true },
    });

    const totalRevenue = Number(invoicesAgg._sum.totalAmount || 0);
    const paidAmount = Number(invoicesAgg._sum.amountPaid || 0);
    const pendingPayments = totalRevenue - paidAmount;

    // Recent calling activities
    const recentCalls = await this.prisma.call.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true } },
        lead: { include: { contact: true } },
        service: { select: { name: true } },
      },
    });

    // Recent clients
    const recentClients = await this.prisma.tenant.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { leads: true, calls: true } },
      },
    });

    return {
      totalClients,
      activeClients,
      pendingOnboarding,
      totalLeads,
      totalCalls,
      connectedCalls,
      failedCalls,
      totalBillableMinutes: Number(usageAgg._sum.billableMinutes || 0),
      totalProviderCost: Number(usageAgg._sum.providerCost || 0),
      totalRevenue,
      pendingPayments,
      recentCalls,
      recentClients,
    };
  }
}
