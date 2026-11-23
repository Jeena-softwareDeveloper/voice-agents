import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from '../../dto/service.dto';
import { GeminiService } from '../../integrations/gemini/gemini.service';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  async createService(tenantId: string, dto: CreateServiceDto, userId?: string) {
    const existing = await this.prisma.service.findFirst({
      where: {
        tenantId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException(`A service named '${dto.name}' already exists for your company.`);
    }

    const created = await this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        location: dto.location || dto.marketLocation,
        marketLocation: dto.marketLocation || dto.location,
        pricingInfo: dto.pricingInfo,
        additionalInfo: dto.additionalInfo,
        extractedInfo: dto.extractedInfo || null,
        approvalStatus: 'PENDING_APPROVAL',
        isActive: true,
      },
    });

    // 1. Save uploaded marketing materials if provided
    if (dto.marketingMaterials && Array.isArray(dto.marketingMaterials) && dto.marketingMaterials.length > 0) {
      for (const mat of dto.marketingMaterials) {
        await this.prisma.serviceMarketingMaterial.create({
          data: {
            tenantId,
            serviceId: created.id,
            fileName: mat.fileName || 'Marketing-Asset',
            fileType: mat.fileType || 'application/pdf',
            fileSize: mat.fileSize || 0,
            fileUrl: mat.fileUrl || null,
            rawContent: mat.rawContent || null,
            extractedData: mat.extractedData || dto.extractedInfo || null,
          },
        });
      }
    }

    // 2. Save AI Calling Configuration as DRAFT
    if (dto.aiCallingConfig) {
      const cfg = dto.aiCallingConfig;
      await this.prisma.serviceAiConfig.create({
        data: {
          tenantId,
          serviceId: created.id,
          openingIntro: cfg.openingGreeting || cfg.openingIntro || `Hello, this is your advisor regarding ${created.name}.`,
          companyIdentity: cfg.companyIdentity || dto.name,
          serviceDescription: created.description,
          instructions: cfg.instructions || `Engage prospects politely for ${created.name}. Qualify interest and schedule follow-ups.`,
          qualificationQuestions: cfg.qualificationQuestions || [],
          approvedResponses: cfg.approvedResponses || {},
          objectionHandling: cfg.objectionHandling || {},
          talkingPoints: cfg.talkingPoints || [],
          faqs: cfg.faqs || [],
          language: cfg.language || 'hi-IN',
          voice: cfg.voice || 'meera',
          closingStatement: cfg.closingStatement || 'Thank you for your time. Have a wonderful day!',
          version: 1,
          status: cfg.status || 'DRAFT',
        },
      });
    }

    // 3. Save Follow-up Workflow Stages if provided
    if (dto.followUpStages && Array.isArray(dto.followUpStages) && dto.followUpStages.length > 0) {
      for (let i = 0; i < dto.followUpStages.length; i++) {
        const stage = dto.followUpStages[i];
        await this.prisma.serviceFollowUpStage.create({
          data: {
            tenantId,
            serviceId: created.id,
            order: stage.order !== undefined ? stage.order : i + 1,
            name: stage.name || `Stage ${i + 1}`,
            triggerTiming: stage.triggerTiming || 'Day 1',
            questions: stage.questions || [],
            expectedResponse: stage.expectedResponse || null,
            nextAction: stage.nextAction || 'Continue Follow-up',
            callbackScheduling: stage.callbackScheduling ?? true,
            meetingScheduling: stage.meetingScheduling ?? false,
            retryLimit: stage.retryLimit ?? 3,
            stopConditions: stage.stopConditions || null,
            isActive: true,
          },
        });
      }
    }

    // Audit Log entry
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: userId || null,
          action: 'CREATE_SERVICE_WORKFLOW',
          entity: 'Service',
          entityId: created.id,
          details: {
            serviceName: created.name,
            category: created.category,
            materialsCount: dto.marketingMaterials?.length || 0,
            hasAiConfig: Boolean(dto.aiCallingConfig),
            stagesCount: dto.followUpStages?.length || 0,
          },
        },
      });
    } catch {}

    return this.getServiceById(tenantId, created.id);
  }

  async getTenantServices(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId },
      include: {
        serviceAiConfig: true,
        marketingMaterials: true,
        followUpStages: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { leads: true, calls: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getServiceById(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
      include: {
        serviceAiConfig: true,
        marketingMaterials: true,
        followUpStages: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { leads: true, calls: true, customers: true },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service category not found.');
    }

    return service;
  }

  // Gemini extraction endpoint for uploaded materials
  async extractMarketingMaterials(
    tenantId: string,
    files: Array<{ fileName: string; fileType: string; rawText?: string; base64?: string }>,
    serviceContext: { name: string; category: string; location?: string; description?: string },
  ) {
    return this.geminiService.extractFromMarketingMaterials(files, serviceContext);
  }

  // AI calling config generator
  async generateAiCallingConfig(
    tenantId: string,
    serviceContext: { name: string; category: string; location?: string; description?: string; pricingInfo?: string },
    extractedInfo?: any,
  ) {
    return this.geminiService.generateServiceAiCallingConfig(serviceContext, extractedInfo);
  }

  // Follow-up workflow stages generator
  async generateWorkflowStages(
    tenantId: string,
    serviceContext: { name: string; category: string; location?: string },
    extractedInfo?: any,
  ) {
    return this.geminiService.generateFollowUpStages(serviceContext, extractedInfo);
  }

  // Approve AI calling configuration
  async approveServiceAiConfig(tenantId: string, serviceId: string, userId?: string) {
    const service = await this.getServiceById(tenantId, serviceId);

    if (service.serviceAiConfig) {
      await this.prisma.serviceAiConfig.update({
        where: { id: service.serviceAiConfig.id },
        data: {
          status: 'APPROVED',
        },
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        approvalStatus: 'APPROVED',
      },
      include: {
        serviceAiConfig: true,
        followUpStages: { orderBy: { order: 'asc' } },
        marketingMaterials: true,
      },
    });

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: userId || null,
          action: 'APPROVE_SERVICE_AI_CONFIG',
          entity: 'Service',
          entityId: serviceId,
          details: { serviceName: service.name, approvedAt: new Date().toISOString() },
        },
      });
    } catch {}

    return updated;
  }

  // Update or reorder follow-up stages
  async updateFollowUpStages(tenantId: string, serviceId: string, stages: any[], userId?: string) {
    await this.getServiceById(tenantId, serviceId);

    // Replace stages atomically
    await this.prisma.serviceFollowUpStage.deleteMany({
      where: { serviceId, tenantId },
    });

    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      await this.prisma.serviceFollowUpStage.create({
        data: {
          tenantId,
          serviceId,
          order: s.order !== undefined ? s.order : i + 1,
          name: s.name,
          triggerTiming: s.triggerTiming || 'Immediate',
          questions: s.questions || [],
          expectedResponse: s.expectedResponse || null,
          nextAction: s.nextAction || 'Continue',
          callbackScheduling: s.callbackScheduling ?? true,
          meetingScheduling: s.meetingScheduling ?? false,
          retryLimit: s.retryLimit ?? 3,
          stopConditions: s.stopConditions || null,
          isActive: true,
        },
      });
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: userId || null,
          action: 'UPDATE_SERVICE_STAGES',
          entity: 'Service',
          entityId: serviceId,
          details: { stageCount: stages.length },
        },
      });
    } catch {}

    return this.prisma.serviceFollowUpStage.findMany({
      where: { serviceId, tenantId },
      orderBy: { order: 'asc' },
    });
  }

  async updateService(tenantId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.getServiceById(tenantId, id);

    if (dto.name && dto.name.toLowerCase() !== service.name.toLowerCase()) {
      const existing = await this.prisma.service.findFirst({
        where: {
          tenantId,
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: service.id },
        },
      });
      if (existing) {
        throw new BadRequestException(`A service named '${dto.name}' already exists.`);
      }
    }

    // If critical attributes changed, revert approval status so admin reviews AI mapping
    const requiresReapproval =
      (dto.name && dto.name !== service.name) ||
      (dto.description && dto.description !== service.description);

    const updated = await this.prisma.service.update({
      where: { id: service.id },
      data: {
        ...dto,
        approvalStatus: requiresReapproval ? 'PENDING_APPROVAL' : service.approvalStatus,
      },
    });

    try {
      await (this.prisma as any).tenantAgentConfiguration.updateMany({
        where: { tenantId, status: { in: ['APPROVED', 'PUBLISHED'] } },
        data: {
          isOutdated: true,
          outdatedReason: 'Service offering details were updated. Review and regenerate AI instructions.',
        },
      });
    } catch {}

    return updated;
  }

  async deleteService(tenantId: string, id: string) {
    const service = await this.getServiceById(tenantId, id);
    const deleted = await this.prisma.service.delete({
      where: { id: service.id },
    });

    try {
      await (this.prisma as any).tenantAgentConfiguration.updateMany({
        where: { tenantId, status: { in: ['APPROVED', 'PUBLISHED'] } },
        data: {
          isOutdated: true,
          outdatedReason: 'A service offering was deleted. Review and regenerate AI instructions.',
        },
      });
    } catch {}

    return deleted;
  }

  // Admin: View all services across tenants requiring review/approval
  async getAllServicesForAdmin(tenantIdFilter?: string, statusFilter?: any) {
    const where: any = {};
    if (tenantIdFilter) where.tenantId = tenantIdFilter;
    if (statusFilter) where.approvalStatus = statusFilter;

    return this.prisma.service.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, email: true },
        },
        serviceAiConfig: true,
        _count: {
          select: { leads: true, calls: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
