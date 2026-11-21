import { IsNotEmpty, IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateAiConversationTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  industry: string;

  @IsNotEmpty()
  @IsString()
  openingIntro: string;

  @IsNotEmpty()
  @IsString()
  instructions: string;

  @IsNotEmpty()
  qualificationQuestions: any;

  @IsNotEmpty()
  approvedResponses: any;

  @IsNotEmpty()
  objectionHandling: any;

  @IsNotEmpty()
  @IsString()
  closingStatement: string;

  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @IsOptional()
  @IsString()
  defaultVoice?: string;
}

export class ConfigureServiceAiConfigDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsNotEmpty()
  @IsString()
  openingIntro: string;

  @IsNotEmpty()
  @IsString()
  companyIdentity: string;

  @IsNotEmpty()
  @IsString()
  serviceDescription: string;

  @IsNotEmpty()
  @IsString()
  instructions: string;

  @IsNotEmpty()
  qualificationQuestions: any;

  @IsNotEmpty()
  approvedResponses: any;

  @IsNotEmpty()
  objectionHandling: any;

  @IsNotEmpty()
  @IsString()
  language: string;

  @IsNotEmpty()
  @IsString()
  voice: string;

  @IsOptional()
  @IsNumber()
  maxDurationSeconds?: number;

  @IsNotEmpty()
  @IsString()
  closingStatement: string;

  @IsOptional()
  @IsString()
  escalationPolicy?: string;

  @IsOptional()
  @IsString()
  status?: 'APPROVED' | 'DRAFT' | 'ACTIVE';
}
