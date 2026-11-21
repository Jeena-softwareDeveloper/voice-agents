import { IsEmail, IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsEmail()
  businessEmail: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsString()
  businessType: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  // Administrator Details
  @IsNotEmpty()
  @IsString()
  adminName: string;

  @IsNotEmpty()
  @IsEmail()
  adminEmail: string;

  @IsOptional()
  @IsString()
  adminMobile?: string;

  // Account Configuration
  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCallingLimit?: number;

  @IsOptional()
  @IsNumber()
  initialCredits?: number;
}

export class UpdateTenantStatusDto {
  @IsNotEmpty()
  @IsString()
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';

  @IsOptional()
  aiCallingEnabled?: boolean;

  @IsOptional()
  monthlyCallingLimit?: number;
}

export class CompleteBusinessOnboardingDto {
  @IsNotEmpty()
  @IsString()
  businessName: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  operatingLocations?: string;

  @IsOptional()
  @IsString()
  primaryObjective?: string;
}
