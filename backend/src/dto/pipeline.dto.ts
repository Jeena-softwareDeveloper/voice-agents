import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdatePipelineStageDto {
  @IsNotEmpty()
  @IsString()
  leadId: string;

  @IsNotEmpty()
  @IsEnum(LeadStatus)
  newStage: LeadStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
