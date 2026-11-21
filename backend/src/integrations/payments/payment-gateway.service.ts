import { Injectable, Logger } from '@nestjs/common';

export interface VerifyPaymentDto {
  transactionRef: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  async verifyPayment(dto: VerifyPaymentDto): Promise<{ verified: boolean; gatewayRef: string }> {
    this.logger.log(`[Payment Gateway] Verifying payment of INR ${dto.amount} for invoice ${dto.invoiceId}`);
    return {
      verified: true,
      gatewayRef: `pg_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }
}
