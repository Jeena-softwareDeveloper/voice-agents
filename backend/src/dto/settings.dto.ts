import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateGlobalSettingsDto {
  @IsOptional()
  @IsString()
  sarvamApiKey?: string;

  @IsOptional()
  @IsString()
  sarvamApiBaseUrl?: string;

  @IsOptional()
  @IsNumber()
  aiMinutePricing?: number;

  @IsOptional()
  @IsNumber()
  telephonyPricing?: number;

  @IsOptional()
  @IsNumber()
  defaultCallingStartHour?: number;

  @IsOptional()
  @IsNumber()
  defaultCallingEndHour?: number;

  @IsOptional()
  @IsNumber()
  concurrencyLimit?: number;

  @IsOptional()
  @IsString()
  defaultLanguage?: string;
}

export class UpdateTenantCallingSettingsDto {
  @IsOptional()
  @IsNumber()
  startHour?: number;

  @IsOptional()
  @IsNumber()
  endHour?: number;

  @IsOptional()
  @IsNumber()
  maxDailyCalls?: number;

  @IsOptional()
  @IsNumber()
  maxRetries?: number;

  @IsOptional()
  @IsBoolean()
  isAutomatedCallingEnabled?: boolean;
}
