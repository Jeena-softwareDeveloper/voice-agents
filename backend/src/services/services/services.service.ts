import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from '../../dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async createService(tenantId: string, dto: CreateServiceDto) {
    const existing = await this.prisma.service.findFirst({
      where: {
        tenantId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException(`A service named '${dto.name}' already exists for your company.`);
    }

    return this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        location: dto.location,
        pricingInfo: dto.pricingInfo,
        additionalInfo: dto.additionalInfo,
        approvalStatus: 'PENDING_APPROVAL',
        isActive: true,
      },
    });
  }

  async getTenantServices(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId },
      include: {
        serviceAiConfig: true,
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

  async updateService(tenantId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.getServiceById(tenantId, id);

    // If critical attributes changed, revert approval status so admin reviews AI mapping
    const requiresReapproval =
      (dto.name && dto.name !== service.name) ||
      (dto.description && dto.description !== service.description);

    return this.prisma.service.update({
      where: { id: service.id },
      data: {
        ...dto,
        approvalStatus: requiresReapproval ? 'PENDING_APPROVAL' : service.approvalStatus,
      },
    });
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
