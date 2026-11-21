import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConvertCustomerDto } from '../../dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async convertLeadToCustomer(tenantId: string, dto: ConvertCustomerDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, tenantId },
      include: { contact: true, service: true },
    });

    if (!lead) {
      throw new NotFoundException('Lead record not found.');
    }

    // 1. Verify or find existing Customer by contactId
    let customer = await this.prisma.customer.findUnique({
      where: {
        tenantId_contactId: {
          tenantId,
          contactId: lead.contactId,
        },
      },
    });

    if (customer) {
      // Customer already exists for this contact (multi-service customer)
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalContractValue: { increment: dto.contractValue || 0 },
          notes: dto.notes ? `${customer.notes || ''}\n${dto.notes}` : customer.notes,
        },
      });
    } else {
      // Create new Customer referencing the contact
      customer = await this.prisma.customer.create({
        data: {
          tenantId,
          contactId: lead.contactId,
          primaryServiceId: lead.serviceId,
          convertedLeadId: lead.id,
          totalContractValue: dto.contractValue || 0,
          status: 'ACTIVE',
          notes: dto.notes,
        },
      });
    }

    // Update lead status to WON
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'WON' },
    });

    // Record pipeline history
    await this.prisma.salesPipelineHistory.create({
      data: {
        tenantId,
        leadId: lead.id,
        fromStatus: lead.status,
        toStatus: 'WON',
        reason: 'Converted to Customer',
      },
    });

    return customer;
  }

  async getTenantCustomers(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        contact: {
          include: {
            leads: {
              include: { service: true },
            },
          },
        },
        primaryService: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomerById(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        contact: {
          include: {
            leads: {
              include: {
                service: true,
                calls: { orderBy: { createdAt: 'desc' } },
              },
            },
            followUps: { orderBy: { dueDate: 'desc' } },
          },
        },
        primaryService: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer record not found.');
    }

    return customer;
  }
}
