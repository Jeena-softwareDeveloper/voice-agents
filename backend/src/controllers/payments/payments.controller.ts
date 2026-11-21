import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from '../../services/payments/payments.service';
import { CreateInvoiceDto, RecordPaymentDto } from '../../dto/payment.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('invoices')
  async getTenantInvoices(@CurrentTenant() tenantId: string) {
    return this.paymentsService.getTenantInvoices(tenantId);
  }

  @Post('invoices')
  async generateInvoice(@Body() dto: CreateInvoiceDto) {
    return this.paymentsService.generateInvoice(dto);
  }

  @Post('record')
  async recordPayment(@Body() dto: RecordPaymentDto) {
    return this.paymentsService.recordPayment(dto);
  }
}
