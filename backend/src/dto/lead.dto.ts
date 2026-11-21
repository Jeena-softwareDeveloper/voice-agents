import { IsNotEmpty, IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { LeadStatus, InterestLevel } from '@prisma/client';

export class CreateLeadDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  leadSource?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  callingConsent?: boolean;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(InterestLevel)
  interestLevel?: InterestLevel;

  @IsOptional()
  aiCallingEligible?: boolean;

  @IsOptional()
  qualificationNotes?: string;

  @IsOptional()
  nextFollowUpDate?: string;
}
