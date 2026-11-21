import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from '../../dto/lead.dto';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async createLead(tenantId: string, dto: CreateLeadDto) {
    // 1. Verify service belongs to tenant
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId },
    });
    if (!service) {
      throw new BadRequestException('Invalid service category for this tenant.');
    }

    const cleanPhone = dto.phone.replace(/[^0-9+]/g, '');

    // 2. Find or create Contact (Single Source of Truth)
    let contact = await this.prisma.contact.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone: cleanPhone,
        },
      },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          tenantId,
          fullName: dto.name,
          phone: cleanPhone,
          email: dto.email,
          location: dto.location,
          notes: dto.notes,
          consentGranted: dto.callingConsent !== undefined ? dto.callingConsent : true,
          consentSource: dto.leadSource || 'Manual Entry',
        },
      });
    }

    // 3. Check for existing active lead for this contact + service combination
    const existingLead = await this.prisma.lead.findFirst({
      where: {
        tenantId,
        contactId: contact.id,
        serviceId: service.id,
      },
    });

    if (existingLead) {
      throw new BadRequestException(
        `Lead already exists for contact '${contact.fullName}' under service '${service.name}'.`,
      );
    }

    // 4. Create Lead
    return this.prisma.lead.create({
      data: {
        tenantId,
        contactId: contact.id,
        serviceId: service.id,
        leadSource: dto.leadSource || 'Manual CRM Creation',
        status: 'NEW_LEAD',
        interestLevel: 'MEDIUM',
        aiCallingEligible: true,
        qualificationNotes: dto.notes,
      },
      include: {
        contact: true,
        service: true,
      },
    });
  }

  async getTenantLeads(
    tenantId: string,
    filters?: {
      serviceId?: string;
      status?: LeadStatus;
      search?: string;
      aiCallingEligible?: boolean;
    },
  ) {
    const where: any = { tenantId };

    if (filters?.serviceId) where.serviceId = filters.serviceId;
    if (filters?.status) where.status = filters.status;
    if (filters?.aiCallingEligible !== undefined) where.aiCallingEligible = filters.aiCallingEligible;

    if (filters?.search) {
      where.contact = {
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        contact: true,
        service: {
          include: {
            serviceAiConfig: {
              select: { status: true, language: true, voice: true },
            },
          },
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        followUps: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeadById(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        service: {
          include: {
            serviceAiConfig: true,
          },
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          include: {
            usageLedger: true,
          },
        },
        followUps: {
          orderBy: { dueDate: 'desc' },
        },
        pipelineHistories: {
          orderBy: { createdAt: 'desc' },
          include: { changedByUser: { select: { fullName: true } } },
        },
        customers: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found.');
    }

    return lead;
  }

  async updateLead(tenantId: string, id: string, dto: UpdateLeadDto, userId?: string) {
    const lead = await this.getLeadById(tenantId, id);

    if (dto.status && dto.status !== lead.status) {
      // Record pipeline history
      await this.prisma.salesPipelineHistory.create({
        data: {
          tenantId,
          leadId: lead.id,
          fromStatus: lead.status,
          toStatus: dto.status,
          reason: dto.qualificationNotes || 'Stage changed by agent',
          changedByUserId: userId,
        },
      });
    }

    return this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: dto.status || lead.status,
        interestLevel: dto.interestLevel || lead.interestLevel,
        aiCallingEligible: dto.aiCallingEligible !== undefined ? dto.aiCallingEligible : lead.aiCallingEligible,
        qualificationNotes: dto.qualificationNotes || lead.qualificationNotes,
        nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : lead.nextFollowUpDate,
      },
      include: {
        contact: true,
        service: true,
      },
    });
  }

  // Cross-tenant leads query for Platform Admin Calls tab
  async getAllLeadsForAdmin(filters?: {
    tenantId?: string;
    serviceCategory?: string;
    callStatus?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.serviceCategory) where.service = { category: filters.serviceCategory };

    if (filters?.search) {
      where.contact = {
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
        ],
      };
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true } },
        contact: true,
        service: {
          include: {
            serviceAiConfig: { select: { status: true, language: true, voice: true } },
          },
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
