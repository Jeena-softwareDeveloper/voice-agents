import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from '../../dto/follow-up.dto';
import { FollowUpStatus } from '@prisma/client';

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  async getTenantFollowUps(tenantId: string, filter?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = { tenantId };

    if (filter === 'today') {
      where.status = { not: 'COMPLETED' };
      where.dueDate = { gte: startOfToday, lte: endOfToday };
    } else if (filter === 'upcoming') {
      where.status = { not: 'COMPLETED' };
      where.dueDate = { gt: endOfToday };
    } else if (filter === 'overdue') {
      where.status = { not: 'COMPLETED' };
      where.dueDate = { lt: startOfToday };
    } else if (filter === 'completed') {
      where.status = 'COMPLETED';
    }

    return this.prisma.followUp.findMany({
      where,
      include: {
        contact: true,
        service: true,
        stage: true,
        lead: {
          include: {
            service: true,
            calls: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async createFollowUp(tenantId: string, dto: CreateFollowUpDto) {
    return this.prisma.followUp.create({
      data: {
        tenantId,
        contactId: dto.contactId,
        leadId: dto.leadId,
        serviceId: dto.serviceId,
        stageId: dto.stageId,
        currentStage: dto.currentStage,
        meetingStatus: dto.meetingStatus || (dto.type === 'SITE_VISIT' || dto.type === 'DEMO' ? 'SCHEDULED' : null),
        assignedOwner: dto.assignedOwner || 'AI Voice Assistant',
        title: dto.title,
        description: dto.description,
        type: dto.type || 'CALLBACK',
        priority: dto.priority || 'MEDIUM',
        dueDate: new Date(dto.dueDate),
        status: 'PENDING',
      },
      include: {
        contact: true,
        service: true,
        stage: true,
        lead: {
          include: {
            service: true,
            calls: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
  }

  async updateFollowUp(tenantId: string, id: string, dto: UpdateFollowUpDto) {
    const followUp = await this.prisma.followUp.findFirst({
      where: { id, tenantId },
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up task not found.');
    }

    return this.prisma.followUp.update({
      where: { id },
      data: {
        status: dto.status || followUp.status,
        outcomeNotes: dto.outcomeNotes || followUp.outcomeNotes,
        meetingStatus: dto.meetingStatus !== undefined ? dto.meetingStatus : followUp.meetingStatus,
        currentStage: dto.currentStage || followUp.currentStage,
        assignedOwner: dto.assignedOwner || followUp.assignedOwner,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : followUp.dueDate,
      },
      include: {
        contact: true,
        service: true,
        stage: true,
        lead: {
          include: {
            service: true,
            calls: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
  }
}
