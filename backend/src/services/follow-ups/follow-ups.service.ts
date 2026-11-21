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
        lead: {
          include: { service: true },
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
        title: dto.title,
        description: dto.description,
        type: dto.type || 'CALLBACK',
        priority: dto.priority || 'MEDIUM',
        dueDate: new Date(dto.dueDate),
        status: 'PENDING',
      },
      include: {
        contact: true,
        lead: { include: { service: true } },
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
      },
      include: {
        contact: true,
        lead: { include: { service: true } },
      },
    });
  }
}
