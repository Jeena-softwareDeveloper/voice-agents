import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { IntegrationsService } from '../../integrations/integrations.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';
import { IntegrationProvider } from '@prisma/client';

@Controller('integrations')
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(private readonly integrationsService: IntegrationsService) {}

  // =========================================================================
  // 1. Inbound Webhooks for WhatsApp & Meta Lead Ads (Public, Authenticated via Hub Signature)
  // =========================================================================
  @Get('webhook/meta')
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken =
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      process.env.META_WEBHOOK_VERIFY_TOKEN ||
      'jeenora_webhook_verification_token_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('Meta/WhatsApp Webhook verified successfully');
      return res.status(HttpStatus.OK).send(challenge);
    }
    this.logger.warn(`Webhook verification failed. Mode: ${mode}, Token received: ${token}`);
    return res.status(HttpStatus.FORBIDDEN).send('Verification token mismatch');
  }

  @Post('webhook/meta')
  @HttpCode(HttpStatus.OK)
  async handleMetaWebhook(@Body() payload: any) {
    this.logger.log(`Received Meta/WhatsApp Webhook event: ${JSON.stringify(payload).substring(0, 200)}...`);
    // Acknowledge receipt immediately to avoid Meta retries
    return { status: 'EVENT_RECEIVED' };
  }

  // =========================================================================
  // 2. Protected Tenant Endpoints (Strict Tenant Isolation)
  // =========================================================================
  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getTenantIntegrations(@CurrentTenant() tenantId: string) {
    return this.integrationsService.getTenantIntegrations(tenantId);
  }

  @Get(':provider')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getIntegrationDetails(
    @CurrentTenant() tenantId: string,
    @Param('provider') provider: IntegrationProvider,
  ) {
    return this.integrationsService.getIntegrationDetails(tenantId, provider);
  }

  @Get(':provider/oauth-url')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getOAuthUrl(
    @CurrentTenant() tenantId: string,
    @Param('provider') provider: IntegrationProvider,
    @Query('redirectUri') redirectUri?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.integrationsService.generateOAuthUrl(tenantId, provider, redirectUri, clientId);
  }

  @Post(':provider/oauth-callback')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async handleOAuthCallback(
    @Body('code') code: string,
    @Body('state') state: string,
    @Body('redirectUri') redirectUri?: string,
  ) {
    return this.integrationsService.handleOAuthCallback(code, state, redirectUri);
  }

  // Google Direct Connect (Gmail & Google Calendar)
  @Post('google/connect')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async connectGoogle(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      provider: IntegrationProvider;
      accessToken?: string;
      refreshToken?: string;
      email?: string;
      name?: string;
      clientId?: string;
      clientSecret?: string;
    },
  ) {
    return this.integrationsService.connectGoogleDirect(tenantId, body);
  }

  // Google Platform OAuth Configuration
  @Get('google/platform-config')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getGooglePlatformConfig() {
    return this.integrationsService.getGooglePlatformConfig();
  }

  @Post('google/platform-config')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async configureGooglePlatform(
    @Body() body: { clientId: string; clientSecret?: string },
  ) {
    return this.integrationsService.configureGooglePlatform(body.clientId, body.clientSecret);
  }

  // WhatsApp
  @Post('whatsapp/connect')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async connectWhatsApp(
    @CurrentTenant() tenantId: string,
    @Body() body: { wabaId: string; phoneNumberId: string; accessToken: string },
  ) {
    return this.integrationsService.connectWhatsApp(tenantId, body);
  }

  @Post('whatsapp/sync-templates')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async syncWhatsAppTemplates(@CurrentTenant() tenantId: string) {
    return this.integrationsService.syncWhatsAppTemplates(tenantId);
  }

  // Facebook & Meta Ads
  @Post('facebook-meta/connect')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async connectMetaDirect(
    @CurrentTenant() tenantId: string,
    @Body() body: { accessToken: string; appId?: string; appSecret?: string },
  ) {
    return this.integrationsService.connectMetaDirect(tenantId, body);
  }

  @Get('facebook-meta/assets')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getMetaAssets(@CurrentTenant() tenantId: string) {
    return this.integrationsService.getMetaAssets(tenantId);
  }

  @Post('facebook-meta/configure')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async configureMetaAssets(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      pageId?: string;
      pageName?: string;
      adAccountId?: string;
      adAccountName?: string;
      leadFormIds?: string[];
    },
  ) {
    return this.integrationsService.configureMetaAssets(tenantId, body);
  }

  // Google Calendar
  @Get('google-calendar/calendars')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getGoogleCalendars(@CurrentTenant() tenantId: string) {
    return this.integrationsService.getGoogleCalendars(tenantId);
  }

  @Post('google-calendar/configure')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async configureGoogleCalendar(
    @CurrentTenant() tenantId: string,
    @Body() body: { calendarId: string; calendarSummary?: string; timeZone?: string },
  ) {
    return this.integrationsService.configureGoogleCalendar(tenantId, body);
  }

  @Post('google-calendar/meeting')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createCalendarMeeting(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      title: string;
      startTime: string;
      endTime: string;
      attendeeEmail: string;
      description?: string;
    },
  ) {
    return this.integrationsService.createCalendarMeeting(tenantId, body);
  }

  // Gmail
  @Post('gmail/test-send')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async sendTestEmail(
    @CurrentTenant() tenantId: string,
    @Body() body: { to: string; subject: string; bodyContent: string },
  ) {
    return this.integrationsService.sendTestEmail(tenantId, body.to, body.subject, body.bodyContent);
  }

  // Disconnect
  @Delete(':provider')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async disconnectIntegration(
    @CurrentTenant() tenantId: string,
    @Param('provider') provider: IntegrationProvider,
  ) {
    return this.integrationsService.disconnectIntegration(tenantId, provider);
  }
}
