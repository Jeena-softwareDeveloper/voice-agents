import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class SalesPipelineService {
  constructor(private prisma: PrismaService) {}

  async getPipelineStages(tenantId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      include: {
        contact: true,
        service: true,
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const stages: Record<LeadStatus, any[]> = {
      NEW_LEAD: [],
      AI_CONTACTED: [],
      QUALIFIED: [],
      INTERESTED: [],
      MEETING_SCHEDULED: [],
      NEGOTIATION: [],
      WON: [],
      LOST: [],
    };

    leads.forEach((lead) => {
      if (stages[lead.status]) {
        stages[lead.status].push(lead);
      }
    });

    return stages;
  }

  async moveStage(tenantId: string, leadId: string, newStage: LeadStatus, reason?: string, userId?: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found.');
    }

    const [updatedLead] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: leadId },
        data: { status: newStage },
        include: { contact: true, service: true },
      }),
      this.prisma.salesPipelineHistory.create({
        data: {
          tenantId,
          leadId,
          fromStatus: lead.status,
          toStatus: newStage,
          reason: reason || 'Pipeline stage updated',
          changedByUserId: userId,
        },
      }),
    ]);

    return updatedLead;
  }

  async getPipelineHistory(tenantId: string, leadId: string) {
    return this.prisma.salesPipelineHistory.findMany({
      where: { tenantId, leadId },
      include: {
        changedByUser: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
