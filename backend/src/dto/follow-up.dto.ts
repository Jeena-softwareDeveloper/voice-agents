import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { FollowUpType, FollowUpPriority, FollowUpStatus } from '@prisma/client';

export class CreateFollowUpDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsNotEmpty()
  @IsString()
  contactId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FollowUpType)
  type?: FollowUpType;

  @IsOptional()
  @IsEnum(FollowUpPriority)
  priority?: FollowUpPriority;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;
}

export class UpdateFollowUpDto {
  @IsOptional()
  @IsEnum(FollowUpStatus)
  status?: FollowUpStatus;

  @IsOptional()
  @IsString()
  outcomeNotes?: string;
}
