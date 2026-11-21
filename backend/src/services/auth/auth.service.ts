import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, ActivateAccountDto } from '../../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tenantMembership = user.memberships[0];
    const tenant = tenantMembership?.tenant;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant?.id || null,
      tenantStatus: tenant?.status || null,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            aiCallingEnabled: tenant.aiCallingEnabled,
          }
        : null,
    };
  }

  async activateAccount(dto: ActivateAccountDto) {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { token: dto.token },
      include: { tenant: true },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is invalid or has already been used.');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation link has expired. Request a new one.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!existingUser) {
      throw new NotFoundException('Associated user record not found.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          isActive: true,
        },
      }),
      this.prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.tenant.update({
        where: { id: invitation.tenantId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    return {
      success: true,
      message: 'Account successfully activated. Please proceed to login.',
      email: invitation.email,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        memberships: {
          select: {
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                aiCallingEnabled: true,
                monthlyCallingLimit: true,
                usedCallingMinutes: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return user;
  }
}
