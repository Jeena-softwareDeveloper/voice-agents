import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsString()
  billingPeriodStart: string;

  @IsNotEmpty()
  @IsString()
  billingPeriodEnd: string;
}

export class RecordPaymentDto {
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  transactionRef: string;

  @IsOptional()
  @IsString()
  gateway?: string;
}
