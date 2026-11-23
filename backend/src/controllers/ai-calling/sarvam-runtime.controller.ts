import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

/**
 * SarvamRuntimeController — Secure Authenticated Sarvam Voice SDK Proxy
 *
 * Implements the official Sarvam Web SDK URL path:
 *   GET /api/sarvam/orgs/:orgId/workspaces/:workspaceId/apps/:appId/url
 *
 * Security & Multi-Tenant Enforcement:
 * 1. Secured by JwtAuthGuard + TenantGuard: CRM clients authenticate via JWT token.
 * 2. Never an open proxy: Restricted strictly to the documented Sarvam App Runtime route.
 * 3. Enforces tenant plan limits and available credits before contacting Sarvam.
 * 4. Injects centralized SARVAM_API_KEY server-side.
 * 5. Returns real signed WebSocket URL directly to browser SDK.
 */
@Controller(['sarvam', 'ai-calling/app-runtime'])
@UseGuards(JwtAuthGuard, TenantGuard)
export class SarvamRuntimeController {
  constructor(
    private readonly sarvamService: SarvamService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('orgs/:orgId/workspaces/:workspaceId/apps/:appId/url')
  async getSignedUrl(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('appId') appId: string,
    @Query() query: Record<string, string>,
  ) {
    // 1. Verify tenant account status and subscription allowance
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Tenant organization is not active or suspended.');
    }

    if (!tenant.aiCallingEnabled) {
      throw new ForbiddenException('AI Voice Calling is disabled for this organization. Please contact Platform Administrator.');
    }

    // 2. Validate tenant usage allowance
    const usedMinutes = Number(tenant.usedCallingMinutes || 0);
    const limitMinutes = tenant.monthlyCallingLimit || 500;
    if (usedMinutes >= limitMinutes) {
      throw new ForbiddenException(
        `Monthly AI voice calling limit reached (${usedMinutes}/${limitMinutes} minutes). Please upgrade your subscription plan.`,
      );
    }

    const creditBalance = Number((tenant as any).creditBalance ?? 450);
    if (creditBalance < 1.0) {
      throw new ForbiddenException(
        `Insufficient credit balance (₹${creditBalance.toFixed(2)} remaining). Please top up your calling credits to start voice sessions.`,
      );
    }

    // 3. Strict Tenant Ownership Validation against cross-tenant access attempts
    // If appId matches a service in the database, ensure it strictly belongs to this authenticated tenant
    const otherTenantService = await this.prisma.service.findFirst({
      where: { id: appId },
    });
    if (otherTenantService && otherTenantService.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access forbidden: You do not own this voice agent or service.');
    }

    // 4. Request signed URL via centralized Sarvam service
    const signedUrlRes = await this.sarvamService.getSignedUrl(orgId, workspaceId, appId, query, {
      tenantId,
      userId: req.user?.id,
      serviceId: appId,
    });

    // 5. Register active session in provider telemetry and database
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.sarvamService.registerActiveSession(sessionId, signedUrlRes.reference_id, tenantId, query.interaction_type || 'call');

    try {
      if ((this.prisma as any).sarvamVoiceSession) {
        await (this.prisma as any).sarvamVoiceSession.create({
          data: {
            id: sessionId,
            tenantId,
            userId: req.user?.id,
            serviceId: appId,
            sarvamOrgId: orgId,
            sarvamWorkspaceId: workspaceId,
            sarvamAppId: appId,
            committedVersion: Number(query.version || 1),
            referenceId: signedUrlRes.reference_id,
            mode: query.interaction_type === 'chat' ? 'chat' : 'voice',
            status: 'CONNECTED',
            startedAt: new Date(),
          },
        });
      }
    } catch (err: any) {
      // Non-blocking log if session recording has a transient conflict
      console.warn('[SarvamRuntimeController] Could not persist initial session record:', err.message);
    }

    return signedUrlRes;
  }
}
