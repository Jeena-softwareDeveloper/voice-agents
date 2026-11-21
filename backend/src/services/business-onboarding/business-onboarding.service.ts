import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CompleteBusinessOnboardingDto } from '../../dto/tenant.dto';

@Injectable()
export class BusinessOnboardingService {
  constructor(private prisma: PrismaService) {}

  async getOnboardingStatus(tenantId: string) {
    const profile = await this.prisma.tenantBusinessProfile.findUnique({
      where: { tenantId },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, status: true },
    });

    return {
      isCompleted: !!profile,
      profile,
      tenant,
    };
  }

  async saveOnboardingProfile(tenantId: string, dto: CompleteBusinessOnboardingDto) {
    return this.prisma.tenantBusinessProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
        businessName: dto.businessName,
        category: dto.category,
        description: dto.description,
        website: dto.website,
        address: dto.address,
        operatingLocations: dto.operatingLocations,
        primaryObjective: dto.primaryObjective,
      },
      update: {
        businessName: dto.businessName,
        category: dto.category,
        description: dto.description,
        website: dto.website,
        address: dto.address,
        operatingLocations: dto.operatingLocations,
        primaryObjective: dto.primaryObjective,
      },
    });
  }
}
