import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import { CreateTenantDto, UpdateTenantStatusDto } from '../../dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createTenant(dto: CreateTenantDto) {
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ email: dto.businessEmail.toLowerCase() }, { name: dto.companyName }],
      },
    });

    if (existingTenant) {
      throw new BadRequestException('A tenant with this company name or email already exists.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('An administrator with this email already exists.');
    }

    const slug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const tempPassword = uuidv4().substring(0, 16);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          email: dto.businessEmail.toLowerCase(),
          phone: dto.contactNumber,
          businessType: dto.businessType,
          country: dto.country || 'India',
          state: dto.state,
          city: dto.city,
          status: 'PENDING',
          aiCallingEnabled: true,
          monthlyCallingLimit: dto.monthlyCallingLimit || 500,
        },
      });

      // 2. Create Initial Administrator User
      const user = await tx.user.create({
        data: {
          email: dto.adminEmail.toLowerCase(),
          fullName: dto.adminName,
          phone: dto.adminMobile,
          passwordHash,
          role: 'TENANT_ADMIN',
          isActive: false, // Activated via invitation link
        },
      });

      // 3. Create Tenant Membership
      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'ADMIN',
        },
      });

      // 4. Create Subscription
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planName: dto.subscriptionPlan || 'Enterprise AI Pro',
          status: 'ACTIVE',
          callingLimitMinutes: dto.monthlyCallingLimit || 500,
          validityUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
          initialCredits: dto.initialCredits || 0,
        },
      });

      // 5. Create Default Calling Settings
      await tx.tenantCallingSetting.create({
        data: {
          tenantId: tenant.id,
          startHour: 9,
          endHour: 20,
          maxDailyCalls: 500,
          maxRetries: 3,
          retryIntervalMinutes: 120,
          timezone: 'Asia/Kolkata',
          isAutomatedCallingEnabled: true,
        },
      });

      // 6. Create Invitation Record
      const invitation = await tx.tenantInvitation.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase(),
          token,
          expiresAt,
          status: 'PENDING',
        },
      });

      return { tenant, user, invitation };
    });

    const frontendBaseUrl = process.env.FRONTEND_URL;
    if (!frontendBaseUrl) {
      throw new Error('Missing required environment configuration: FRONTEND_URL');
    }
    const invitationLink = `${frontendBaseUrl}/activate-account?token=${token}`;

    await this.emailService.sendInvitationEmail(
      dto.adminEmail,
      invitationLink,
      dto.companyName,
    );

    return {
      tenantId: result.tenant.id,
      companyName: result.tenant.name,
      administrator: result.user.fullName,
      email: result.user.email,
      invitationLink,
      status: result.tenant.status,
    };
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: true,
        businessProfile: true,
        _count: {
          select: {
            leads: true,
            calls: true,
            services: true,
            customers: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        businessProfile: true,
        callingSettings: true,
        services: {
          include: {
            serviceAiConfig: true,
            _count: {
              select: { leads: true, calls: true },
            },
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            leads: true,
            calls: true,
            services: true,
            customers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Client tenant not found.');
    }

    return tenant;
  }

  async updateTenantStatus(id: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Client tenant not found.');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        status: dto.status,
        aiCallingEnabled: dto.aiCallingEnabled !== undefined ? dto.aiCallingEnabled : tenant.aiCallingEnabled,
        monthlyCallingLimit: dto.monthlyCallingLimit !== undefined ? dto.monthlyCallingLimit : tenant.monthlyCallingLimit,
      },
    });
  }
}
