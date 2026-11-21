import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvoiceDto, RecordPaymentDto } from '../../dto/payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformPaymentsOverview() {
    const invoices = await this.prisma.invoice.findMany({
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const usageAgg = await this.prisma.aiUsageLedger.aggregate({
      _sum: { billedToClient: true },
    });

    const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
    const paidAmount = invoices.reduce((acc, inv) => acc + Number(inv.amountPaid), 0);
    const pendingAmount = invoices
      .filter((inv) => inv.status === 'PENDING')
      .reduce((acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.amountPaid)), 0);
    const overdueAmount = invoices
      .filter((inv) => inv.status === 'OVERDUE')
      .reduce((acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.amountPaid)), 0);

    return {
      totalRevenue,
      totalAiCallingCharges: Number(usageAgg._sum.billedToClient || 0),
      totalSubscriptionRevenue: totalRevenue - Number(usageAgg._sum.billedToClient || 0),
      paidAmount,
      pendingAmount,
      overdueAmount,
      invoices,
    };
  }

  async generateInvoice(dto: CreateInvoiceDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      include: { subscription: true },
    });

    if (!tenant) throw new NotFoundException('Client tenant not found.');

    const startDate = new Date(dto.billingPeriodStart);
    const endDate = new Date(dto.billingPeriodEnd);

    // Aggregate calling usage for period
    const usage = await this.prisma.aiUsageLedger.aggregate({
      where: {
        tenantId: dto.tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { billableMinutes: true, billedToClient: true },
    });

    const callingMinutes = Number(usage._sum.billableMinutes || 0);
    const callingCharges = Number(usage._sum.billedToClient || 0);
    const subscriptionCharges = 2999; // Standard monthly SaaS subscription charge
    const subtotal = callingCharges + subscriptionCharges;
    const taxAmount = parseFloat((subtotal * 0.18).toFixed(2)); // 18% GST
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${tenant.name.substring(0, 3).toUpperCase()}`;

    return this.prisma.invoice.create({
      data: {
        tenantId: dto.tenantId,
        invoiceNumber,
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
        callingMinutes: new Prisma.Decimal(callingMinutes),
        callingCharges: new Prisma.Decimal(callingCharges),
        subscriptionCharges: new Prisma.Decimal(subscriptionCharges),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalAmount: new Prisma.Decimal(totalAmount),
        amountPaid: new Prisma.Decimal(0),
        status: 'PENDING',
        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000), // 15 days due
      },
    });
  }

  async recordPayment(dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found.');

    const payment = await this.prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        transactionRef: dto.transactionRef,
        amount: new Prisma.Decimal(dto.amount),
        gateway: dto.gateway || 'Bank Transfer / Razorpay',
        status: 'SUCCESS',
      },
    });

    const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
    const isFullyPaid = newAmountPaid >= Number(invoice.totalAmount);

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: new Prisma.Decimal(newAmountPaid),
        status: isFullyPaid ? 'PAID' : 'PENDING',
        paidAt: isFullyPaid ? new Date() : null,
      },
    });

    return payment;
  }

  async getTenantInvoices(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
