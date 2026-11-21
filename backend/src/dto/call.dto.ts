import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class DispatchCallDto {
  @IsNotEmpty()
  @IsString()
  leadId: string;
}

export class BulkDispatchCallDto {
  @IsNotEmpty()
  @IsArray()
  leadIds: string[];
}

export class TelephonyWebhookDto {
  @IsNotEmpty()
  @IsString()
  externalCallId: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  durationSeconds?: number;
  billableSeconds?: number;
  outcome?: string;
  transcript?: string;
  summary?: string;
  objectionHandled?: string;
  recordingUrl?: string;
  callbackTime?: string;
}
