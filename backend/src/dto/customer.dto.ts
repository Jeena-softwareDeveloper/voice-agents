import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class ConvertCustomerDto {
  @IsNotEmpty()
  @IsString()
  leadId: string;

  @IsOptional()
  @IsNumber()
  contractValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
