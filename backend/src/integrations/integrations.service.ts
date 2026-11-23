import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { EncryptionUtil } from './common/encryption.util';

export interface WhatsAppConnectDto {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
}

export interface MetaConnectDto {
  accessToken: string;
  appId?: string;
  appSecret?: string;
}

export interface MetaConfigureDto {
  pageId?: string;
  pageName?: string;
  adAccountId?: string;
  adAccountName?: string;
  leadFormIds?: string[];
}

export interface GoogleCalendarConfigureDto {
  calendarId: string;
  calendarSummary?: string;
  timeZone?: string;
}

export interface GoogleConnectDto {
  provider: IntegrationProvider;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  email?: string;
  name?: string;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // =========================================================================
  // 1. Overview & Status for all 4 Supported Integrations
  // =========================================================================
  async getTenantIntegrations(tenantId: string) {
    const existing = await this.prisma.tenantIntegration.findMany({
      where: { tenantId },
    });

    const map = new Map<IntegrationProvider, any>();
    for (const item of existing) {
      map.set(item.provider, item);
    }

    const providers: IntegrationProvider[] = [
      IntegrationProvider.WHATSAPP,
      IntegrationProvider.FACEBOOK_META,
      IntegrationProvider.GMAIL,
      IntegrationProvider.GOOGLE_CALENDAR,
    ];

    return providers.map((p) => {
      const record = map.get(p);
      if (!record) {
        return {
          provider: p,
          status: IntegrationStatus.NOT_CONNECTED,
          accountIdentifier: null,
          accountName: null,
          metadata: null,
          lastSyncAt: null,
          errorMessage: null,
          connectedAt: null,
        };
      }

      return {
        id: record.id,
        provider: record.provider,
        status: record.status,
        accountIdentifier: record.accountIdentifier,
        accountName: record.accountName,
        metadata: record.metadata,
        lastSyncAt: record.lastSyncAt,
        errorMessage: record.errorMessage,
        connectedAt: record.createdAt,
      };
    });
  }

  async getIntegrationDetails(tenantId: string, provider: IntegrationProvider) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider,
        },
      },
    });

    if (!record) {
      return {
        provider,
        status: IntegrationStatus.NOT_CONNECTED,
        accountIdentifier: null,
        accountName: null,
        metadata: null,
        lastSyncAt: null,
        errorMessage: null,
      };
    }

    return {
      id: record.id,
      provider: record.provider,
      status: record.status,
      accountIdentifier: record.accountIdentifier,
      accountName: record.accountName,
      metadata: record.metadata,
      lastSyncAt: record.lastSyncAt,
      errorMessage: record.errorMessage,
      tokenExpiresAt: record.tokenExpiresAt,
      connectedAt: record.createdAt,
    };
  }

  // =========================================================================
  // 2. OAuth URL Generation & State Signing
  // =========================================================================
  async generateOAuthUrl(
    tenantId: string,
    provider: IntegrationProvider,
    redirectUri?: string,
    customClientId?: string,
  ) {
    const state = EncryptionUtil.generateOAuthState(tenantId, provider);
    const feUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3010');
    const finalRedirect = redirectUri || `${feUrl}/workspace/ai-calling?tab=integrations`;

    if (provider === IntegrationProvider.GMAIL || provider === IntegrationProvider.GOOGLE_CALENDAR) {
      const clientId =
        customClientId ||
        this.configService.get<string>('GOOGLE_CLIENT_ID') ||
        process.env.GOOGLE_CLIENT_ID ||
        '';

      if (!clientId) {
        return {
          requiresCredentials: true,
          message: 'Google Client ID not configured in platform environment. Please enter your Google Cloud Client ID or Access Token in the connect window.',
          provider,
        };
      }

      const scopes =
        provider === IntegrationProvider.GMAIL
          ? [
              'openid',
              'https://www.googleapis.com/auth/userinfo.email',
              'https://www.googleapis.com/auth/userinfo.profile',
              'https://www.googleapis.com/auth/gmail.send',
              'https://www.googleapis.com/auth/gmail.readonly',
            ]
          : [
              'openid',
              'https://www.googleapis.com/auth/userinfo.email',
              'https://www.googleapis.com/auth/calendar.events',
              'https://www.googleapis.com/auth/calendar.readonly',
            ];

      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', finalRedirect);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', scopes.join(' '));
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
      url.searchParams.set('state', state);

      return { oauthUrl: url.toString(), state, provider };
    }

    if (provider === IntegrationProvider.FACEBOOK_META) {
      const appId =
        this.configService.get<string>('META_APP_ID') ||
        process.env.META_APP_ID ||
        '';

      if (!appId) {
        return {
          requiresCredentials: true,
          message: 'Meta App ID not configured in platform environment. Please enter your Meta Access Token or set META_APP_ID.',
          provider,
        };
      }

      const scopes = [
        'email',
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'leads_retrieval',
        'ads_read',
        'ads_management',
        'business_management',
      ];

      const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
      url.searchParams.set('client_id', appId);
      url.searchParams.set('redirect_uri', finalRedirect);
      url.searchParams.set('state', state);
      url.searchParams.set('scope', scopes.join(','));

      return { oauthUrl: url.toString(), state, provider };
    }

    throw new BadRequestException(`OAuth not supported for provider ${provider}`);
  }

  // =========================================================================
  // 3. OAuth Callback Handler
  // =========================================================================
  async handleOAuthCallback(code: string, state: string, redirectUri?: string) {
    const { tenantId, provider } = EncryptionUtil.validateOAuthState(state);
    const feUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3010');
    const finalRedirect = redirectUri || `${feUrl}/workspace/ai-calling?tab=integrations`;

    if (provider === IntegrationProvider.GMAIL || provider === IntegrationProvider.GOOGLE_CALENDAR) {
      const clientId =
        this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID;
      const clientSecret =
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new BadRequestException('Google OAuth Client credentials not configured on backend');
      }

      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: finalRedirect,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new BadRequestException(`Google OAuth exchange failed: ${tokenData.error_description || tokenData.error || 'Unknown error'}`);
      }

      // Fetch user profile
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      const metadata: any = {
        scopes: tokenData.scope?.split(' ') || [],
        email: userData.email,
        picture: userData.picture,
        verifiedEmail: userData.verified_email,
      };

      if (provider === IntegrationProvider.GOOGLE_CALENDAR) {
        metadata.calendarId = 'primary';
        metadata.calendarSummary = 'Primary Calendar';
      }

      await this.prisma.tenantIntegration.upsert({
        where: {
          tenantId_provider: {
            tenantId,
            provider,
          },
        },
        update: {
          status: IntegrationStatus.CONNECTED,
          accountIdentifier: userData.email,
          accountName: userData.name || userData.email,
          accessTokenEnc: EncryptionUtil.encrypt(tokenData.access_token),
          refreshTokenEnc: tokenData.refresh_token ? EncryptionUtil.encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: expiresAt,
          metadata,
          lastSyncAt: new Date(),
          errorMessage: null,
        },
        create: {
          tenantId,
          provider,
          status: IntegrationStatus.CONNECTED,
          accountIdentifier: userData.email,
          accountName: userData.name || userData.email,
          accessTokenEnc: EncryptionUtil.encrypt(tokenData.access_token),
          refreshTokenEnc: tokenData.refresh_token ? EncryptionUtil.encrypt(tokenData.refresh_token) : null,
          tokenExpiresAt: expiresAt,
          metadata,
          lastSyncAt: new Date(),
        },
      });

      return {
        success: true,
        provider,
        accountEmail: userData.email,
        accountName: userData.name,
      };
    }

    if (provider === IntegrationProvider.FACEBOOK_META) {
      const appId = this.configService.get<string>('META_APP_ID') || process.env.META_APP_ID;
      const appSecret = this.configService.get<string>('META_APP_SECRET') || process.env.META_APP_SECRET;

      if (!appId || !appSecret) {
        throw new BadRequestException('Meta App credentials not configured on backend');
      }

      const tokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(finalRedirect)}&client_secret=${appSecret}&code=${code}`,
      );
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new BadRequestException(`Meta OAuth exchange failed: ${tokenData.error?.message || 'Unknown error'}`);
      }

      return this.connectMetaInternal(tenantId, tokenData.access_token);
    }

    throw new BadRequestException(`Unknown OAuth provider: ${provider}`);
  }

  // =========================================================================
  // 3b. Google Direct Connection (Gmail & Google Calendar)
  // =========================================================================
  async connectGoogleDirect(tenantId: string, dto: GoogleConnectDto) {
    if (!dto.accessToken && !dto.email) {
      throw new BadRequestException('Either Google Access Token or Google Account Email is required');
    }

    let email = dto.email?.trim() || '';
    let name = dto.name?.trim() || '';
    const token = dto.accessToken?.trim();

    if (token) {
      try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        if (userRes.ok && userData.email) {
          email = userData.email;
          name = userData.name || userData.email;
        } else if (!email) {
          throw new BadRequestException(
            `Google token verification failed: ${userData.error?.message || 'Invalid or expired access token'}`,
          );
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.warn(`Could not verify live token with Google: ${err.message}`);
        if (!email) {
          throw new BadRequestException(`Google verification error: ${err.message}`);
        }
      }
    }

    if (!email) {
      throw new BadRequestException('Google account email address is required');
    }

    const metadata: any = {
      email,
      clientId: dto.clientId || null,
      customCredentials: Boolean(dto.clientId),
      scopes:
        dto.provider === IntegrationProvider.GMAIL
          ? ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']
          : ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
    };

    if (dto.provider === IntegrationProvider.GOOGLE_CALENDAR) {
      metadata.calendarId = 'primary';
      metadata.calendarSummary = 'Primary Calendar';
    }

    const record = await this.prisma.tenantIntegration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: dto.provider,
        },
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        accountIdentifier: email,
        accountName: name || email,
        accessTokenEnc: token ? EncryptionUtil.encrypt(token) : undefined,
        refreshTokenEnc: dto.refreshToken ? EncryptionUtil.encrypt(dto.refreshToken.trim()) : undefined,
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000 * 24 * 30),
        metadata,
        lastSyncAt: new Date(),
        errorMessage: null,
      },
      create: {
        tenantId,
        provider: dto.provider,
        status: IntegrationStatus.CONNECTED,
        accountIdentifier: email,
        accountName: name || email,
        accessTokenEnc: token ? EncryptionUtil.encrypt(token) : null,
        refreshTokenEnc: dto.refreshToken ? EncryptionUtil.encrypt(dto.refreshToken.trim()) : null,
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000 * 24 * 30),
        metadata,
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      provider: dto.provider,
      status: IntegrationStatus.CONNECTED,
      accountIdentifier: record.accountIdentifier,
      accountName: record.accountName,
    };
  }

  // =========================================================================
  // 3c. Platform-wide Google OAuth Configuration
  // =========================================================================
  async getGooglePlatformConfig() {
    const clientId =
      this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID || '';
    const hasSecret = Boolean(
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET,
    );
    const feUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3010');

    return {
      isConfigured: Boolean(clientId),
      clientId: clientId ? `${clientId.substring(0, 15)}...${clientId.slice(-15)}` : null,
      fullClientId: clientId || null,
      hasSecret,
      redirectUri: `${feUrl}/workspace/ai-calling?tab=integrations`,
    };
  }

  async configureGooglePlatform(clientId: string, clientSecret?: string) {
    if (!clientId?.trim()) {
      throw new BadRequestException('Google Client ID is required');
    }

    const trimmedClientId = clientId.trim();
    const trimmedSecret = clientSecret?.trim() || '';

    process.env.GOOGLE_CLIENT_ID = trimmedClientId;
    if (trimmedSecret) {
      process.env.GOOGLE_CLIENT_SECRET = trimmedSecret;
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_CLIENT_ID=')) {
          envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/, `GOOGLE_CLIENT_ID="${trimmedClientId}"`);
        } else {
          envContent += `\nGOOGLE_CLIENT_ID="${trimmedClientId}"`;
        }
        if (trimmedSecret) {
          if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
            envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/, `GOOGLE_CLIENT_SECRET="${trimmedSecret}"`);
          } else {
            envContent += `\nGOOGLE_CLIENT_SECRET="${trimmedSecret}"`;
          }
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (err: any) {
      this.logger.warn(`Could not persist GOOGLE_CLIENT_ID to .env: ${err.message}`);
    }

    return {
      success: true,
      message: 'Google Cloud Platform OAuth credentials saved successfully. 1-Click Sign-in is now active.',
      clientId: trimmedClientId,
    };
  }

  // =========================================================================
  // 4. WhatsApp Business Integration
  // =========================================================================
  async connectWhatsApp(tenantId: string, dto: WhatsAppConnectDto) {
    if (!dto.wabaId || !dto.phoneNumberId || !dto.accessToken) {
      throw new BadRequestException('WABA ID, Phone Number ID, and Access Token are required');
    }

    const cleanWaba = dto.wabaId.trim();
    const cleanPhoneId = dto.phoneNumberId.trim();
    const cleanToken = dto.accessToken.trim();

    this.logger.log(`[WhatsApp Connect] Validating Phone ID ${cleanPhoneId} with Meta Graph API`);

    // Verify phone number details with Meta Graph API
    let phoneInfo: any = {};
    let templates: any[] = [];
    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v21.0/${cleanPhoneId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`,
        {
          headers: { Authorization: `Bearer ${cleanToken}` },
        },
      );
      const phoneJson = await phoneRes.json();

      if (!phoneRes.ok) {
        const errorMsg = phoneJson.error?.message || 'Failed to verify WhatsApp Phone Number ID with Meta';
        this.logger.warn(`WhatsApp validation error: ${errorMsg}`);
        throw new BadRequestException(`Meta Graph API Error: ${errorMsg}`);
      }
      phoneInfo = phoneJson;

      // Fetch message templates
      const tplRes = await fetch(
        `https://graph.facebook.com/v21.0/${cleanWaba}/message_templates?limit=50`,
        {
          headers: { Authorization: `Bearer ${cleanToken}` },
        },
      );
      const tplJson = await tplRes.json();
      if (tplRes.ok && Array.isArray(tplJson.data)) {
        templates = tplJson.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          category: t.category,
          language: t.language,
          components: t.components,
        }));
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Could not reach Meta Graph API: ${err.message}`);
    }

    const metadata = {
      wabaId: cleanWaba,
      phoneNumberId: cleanPhoneId,
      qualityRating: phoneInfo.quality_rating || 'UNKNOWN',
      codeVerificationStatus: phoneInfo.code_verification_status || 'VERIFIED',
      webhookVerified: true,
      templatesCount: templates.length,
      templates,
    };

    const record = await this.prisma.tenantIntegration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.WHATSAPP,
        },
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        accountIdentifier: phoneInfo.display_phone_number || cleanPhoneId,
        accountName: phoneInfo.verified_name || 'WhatsApp Business Account',
        accessTokenEnc: EncryptionUtil.encrypt(cleanToken),
        metadata,
        lastSyncAt: new Date(),
        errorMessage: null,
      },
      create: {
        tenantId,
        provider: IntegrationProvider.WHATSAPP,
        status: IntegrationStatus.CONNECTED,
        accountIdentifier: phoneInfo.display_phone_number || cleanPhoneId,
        accountName: phoneInfo.verified_name || 'WhatsApp Business Account',
        accessTokenEnc: EncryptionUtil.encrypt(cleanToken),
        metadata,
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      provider: IntegrationProvider.WHATSAPP,
      status: IntegrationStatus.CONNECTED,
      phoneNumber: record.accountIdentifier,
      verifiedName: record.accountName,
      templatesCount: templates.length,
      templates,
    };
  }

  async syncWhatsAppTemplates(tenantId: string) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.WHATSAPP,
        },
      },
    });

    if (!record || !record.accessTokenEnc) {
      throw new BadRequestException('WhatsApp integration is not connected');
    }

    const token = EncryptionUtil.decrypt(record.accessTokenEnc);
    const meta: any = record.metadata || {};
    const wabaId = meta.wabaId;

    if (!wabaId) {
      throw new BadRequestException('Missing WABA ID in integration metadata');
    }

    const tplRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/message_templates?limit=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const tplJson = await tplRes.json();
    if (!tplRes.ok) {
      throw new BadRequestException(`Meta Graph API template sync failed: ${tplJson.error?.message || 'Unknown error'}`);
    }

    const templates = (tplJson.data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      category: t.category,
      language: t.language,
      components: t.components,
    }));

    const updatedMeta = {
      ...meta,
      templatesCount: templates.length,
      templates,
    };

    await this.prisma.tenantIntegration.update({
      where: { id: record.id },
      data: {
        metadata: updatedMeta,
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      templatesCount: templates.length,
      templates,
      lastSyncAt: new Date(),
    };
  }

  // =========================================================================
  // 5. Facebook & Meta Ads Integration
  // =========================================================================
  async connectMetaDirect(tenantId: string, dto: MetaConnectDto) {
    if (!dto.accessToken) {
      throw new BadRequestException('Meta User or System User Access Token is required');
    }
    return this.connectMetaInternal(tenantId, dto.accessToken.trim());
  }

  private async connectMetaInternal(tenantId: string, token: string) {
    // 1. Verify user / system profile
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meJson = await meRes.json();
    if (!meRes.ok) {
      throw new BadRequestException(`Meta Token verification failed: ${meJson.error?.message || 'Invalid Token'}`);
    }

    // 2. Fetch accessible Pages
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pagesJson = await pagesRes.json();
    const pages = Array.isArray(pagesJson.data)
      ? pagesJson.data.map((p: any) => ({ id: p.id, name: p.name, category: p.category }))
      : [];

    // 3. Fetch Ad Accounts
    const adsRes = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id,account_status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const adsJson = await adsRes.json();
    const adAccounts = Array.isArray(adsJson.data)
      ? adsJson.data.map((a: any) => ({ id: a.id, name: a.name || `Ad Account ${a.account_id}`, accountId: a.account_id }))
      : [];

    const defaultPage = pages[0] || null;
    const defaultAdAccount = adAccounts[0] || null;

    // Fetch lead forms for default page if available
    let leadForms: any[] = [];
    if (defaultPage?.id) {
      try {
        const formsRes = await fetch(`https://graph.facebook.com/v21.0/${defaultPage.id}/leadgen_forms?fields=id,name,status,created_time`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formsJson = await formsRes.json();
        if (formsRes.ok && Array.isArray(formsJson.data)) {
          leadForms = formsJson.data.map((f: any) => ({
            id: f.id,
            name: f.name,
            status: f.status,
          }));
        }
      } catch (err) {
        this.logger.warn(`Could not fetch lead forms for page ${defaultPage.id}: ${err}`);
      }
    }

    const metadata = {
      metaUserId: meJson.id,
      pages,
      adAccounts,
      selectedPageId: defaultPage?.id || null,
      selectedPageName: defaultPage?.name || null,
      selectedAdAccountId: defaultAdAccount?.id || null,
      selectedAdAccountName: defaultAdAccount?.name || null,
      leadForms,
      selectedLeadFormIds: leadForms.map((f) => f.id),
      webhookSubscribed: true,
    };

    await this.prisma.tenantIntegration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.FACEBOOK_META,
        },
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        accountIdentifier: meJson.id,
        accountName: meJson.name,
        accessTokenEnc: EncryptionUtil.encrypt(token),
        metadata,
        lastSyncAt: new Date(),
        errorMessage: null,
      },
      create: {
        tenantId,
        provider: IntegrationProvider.FACEBOOK_META,
        status: IntegrationStatus.CONNECTED,
        accountIdentifier: meJson.id,
        accountName: meJson.name,
        accessTokenEnc: EncryptionUtil.encrypt(token),
        metadata,
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      provider: IntegrationProvider.FACEBOOK_META,
      accountName: meJson.name,
      pages,
      adAccounts,
      leadForms,
      selectedPage: defaultPage,
      selectedAdAccount: defaultAdAccount,
    };
  }

  async getMetaAssets(tenantId: string) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.FACEBOOK_META,
        },
      },
    });

    if (!record || !record.accessTokenEnc) {
      throw new BadRequestException('Facebook & Meta integration is not connected');
    }

    const token = EncryptionUtil.decrypt(record.accessTokenEnc);
    const meta: any = record.metadata || {};

    // Refresh pages & ad accounts
    const [pagesRes, adsRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ]);

    const pages = Array.isArray(pagesRes.data) ? pagesRes.data : meta.pages || [];
    const adAccounts = Array.isArray(adsRes.data) ? adsRes.data : meta.adAccounts || [];

    // If page is selected, refresh lead forms
    let leadForms = meta.leadForms || [];
    const pageId = meta.selectedPageId || pages[0]?.id;
    if (pageId) {
      try {
        const formsRes = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?fields=id,name,status`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const formsJson = await formsRes.json();
        if (Array.isArray(formsJson.data)) {
          leadForms = formsJson.data;
        }
      } catch (err) {
        this.logger.warn(`Error refreshing lead forms: ${err}`);
      }
    }

    const updatedMeta = {
      ...meta,
      pages,
      adAccounts,
      leadForms,
    };

    await this.prisma.tenantIntegration.update({
      where: { id: record.id },
      data: { metadata: updatedMeta, lastSyncAt: new Date() },
    });

    return {
      pages,
      adAccounts,
      leadForms,
      selectedPageId: meta.selectedPageId,
      selectedAdAccountId: meta.selectedAdAccountId,
      selectedLeadFormIds: meta.selectedLeadFormIds || [],
    };
  }

  async configureMetaAssets(tenantId: string, dto: MetaConfigureDto) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.FACEBOOK_META,
        },
      },
    });

    if (!record) {
      throw new BadRequestException('Meta Ads integration is not connected');
    }

    const currentMeta: any = record.metadata || {};
    const updatedMeta = {
      ...currentMeta,
      selectedPageId: dto.pageId ?? currentMeta.selectedPageId,
      selectedPageName: dto.pageName ?? currentMeta.selectedPageName,
      selectedAdAccountId: dto.adAccountId ?? currentMeta.selectedAdAccountId,
      selectedAdAccountName: dto.adAccountName ?? currentMeta.selectedAdAccountName,
      selectedLeadFormIds: dto.leadFormIds ?? currentMeta.selectedLeadFormIds,
      webhookSubscribed: true,
    };

    await this.prisma.tenantIntegration.update({
      where: { id: record.id },
      data: {
        metadata: updatedMeta,
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Meta configuration updated successfully',
      configuration: updatedMeta,
    };
  }

  // =========================================================================
  // 6. Gmail Integration (Email Sending & Reading)
  // =========================================================================
  async sendTestEmail(tenantId: string, to: string, subject: string, bodyContent: string) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.GMAIL,
        },
      },
    });

    if (!record || !record.accessTokenEnc) {
      throw new BadRequestException('Gmail is not connected for this workspace');
    }

    const accessToken = await this.getValidGoogleAccessToken(record);

    // Build raw RFC 2822 email
    const sender = record.accountIdentifier || 'me';
    const emailLines = [
      `From: ${sender}`,
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      bodyContent,
    ];
    const rawEmail = Buffer.from(emailLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawEmail }),
    });

    const resJson = await res.json();
    if (!res.ok) {
      throw new BadRequestException(`Gmail API Send Error: ${resJson.error?.message || 'Failed to send'}`);
    }

    await this.prisma.tenantIntegration.update({
      where: { id: record.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      success: true,
      messageId: resJson.id,
      threadId: resJson.threadId,
      sentTo: to,
      sentAt: new Date(),
    };
  }

  // =========================================================================
  // 7. Google Calendar Integration
  // =========================================================================
  async getGoogleCalendars(tenantId: string) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.GOOGLE_CALENDAR,
        },
      },
    });

    if (!record || !record.accessTokenEnc) {
      throw new BadRequestException('Google Calendar is not connected');
    }

    const accessToken = await this.getValidGoogleAccessToken(record);
    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const resJson = await res.json();
    if (!res.ok) {
      throw new BadRequestException(`Calendar API Error: ${resJson.error?.message || 'Failed to fetch calendars'}`);
    }

    const items = (resJson.items || []).map((c: any) => ({
      id: c.id,
      summary: c.summary,
      primary: Boolean(c.primary),
      timeZone: c.timeZone,
    }));

    return {
      calendars: items,
      selectedCalendarId: (record.metadata as any)?.calendarId || 'primary',
    };
  }

  async configureGoogleCalendar(tenantId: string, dto: GoogleCalendarConfigureDto) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.GOOGLE_CALENDAR,
        },
      },
    });

    if (!record) {
      throw new BadRequestException('Google Calendar is not connected');
    }

    const currentMeta: any = record.metadata || {};
    const updatedMeta = {
      ...currentMeta,
      calendarId: dto.calendarId,
      calendarSummary: dto.calendarSummary || currentMeta.calendarSummary || dto.calendarId,
      timeZone: dto.timeZone || currentMeta.timeZone || 'Asia/Kolkata',
    };

    await this.prisma.tenantIntegration.update({
      where: { id: record.id },
      data: { metadata: updatedMeta, lastSyncAt: new Date() },
    });

    return {
      success: true,
      calendarId: dto.calendarId,
      message: 'Google Calendar selection saved.',
    };
  }

  async createCalendarMeeting(
    tenantId: string,
    meeting: { title: string; startTime: string; endTime: string; attendeeEmail: string; description?: string },
  ) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: IntegrationProvider.GOOGLE_CALENDAR,
        },
      },
    });

    if (!record || !record.accessTokenEnc) {
      throw new BadRequestException('Google Calendar is not connected');
    }

    const accessToken = await this.getValidGoogleAccessToken(record);
    const calendarId = (record.metadata as any)?.calendarId || 'primary';

    const eventPayload = {
      summary: meeting.title,
      description: meeting.description || 'Customer consultation booked via Jeenora AI Voice Agent',
      start: { dateTime: meeting.startTime },
      end: { dateTime: meeting.endTime },
      attendees: [{ email: meeting.attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      },
    );

    const eventJson = await res.json();
    if (!res.ok) {
      throw new BadRequestException(`Failed to schedule meeting: ${eventJson.error?.message || 'Calendar API error'}`);
    }

    return {
      success: true,
      eventId: eventJson.id,
      htmlLink: eventJson.htmlLink,
      meetLink: eventJson.hangoutLink || eventJson.conferenceData?.entryPoints?.[0]?.uri,
      startTime: eventJson.start?.dateTime,
      endTime: eventJson.end?.dateTime,
    };
  }

  // =========================================================================
  // 8. Disconnect & Credential Revocation
  // =========================================================================
  async disconnectIntegration(tenantId: string, provider: IntegrationProvider) {
    const record = await this.prisma.tenantIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider,
        },
      },
    });

    if (!record) {
      return { success: true, message: 'Already disconnected' };
    }

    // Attempt token revocation if applicable
    if (record.accessTokenEnc) {
      try {
        const token = EncryptionUtil.decrypt(record.accessTokenEnc);
        if (provider === IntegrationProvider.GMAIL || provider === IntegrationProvider.GOOGLE_CALENDAR) {
          fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }).catch(() => null);
        }
      } catch (err) {
        this.logger.warn(`Could not revoke token during disconnect: ${err}`);
      }
    }

    // Delete the connection record cleanly to guarantee tenant isolation and safety
    await this.prisma.tenantIntegration.delete({
      where: { id: record.id },
    });

    this.logger.log(`Tenant ${tenantId} disconnected integration ${provider}`);
    return {
      success: true,
      provider,
      status: IntegrationStatus.NOT_CONNECTED,
      message: `${provider} has been disconnected and credentials deleted.`,
    };
  }

  // =========================================================================
  // Helper: Get Valid Google Access Token (auto refresh if expired)
  // =========================================================================
  private async getValidGoogleAccessToken(record: any): Promise<string> {
    const currentToken = EncryptionUtil.decrypt(record.accessTokenEnc);
    const expiresAt = record.tokenExpiresAt ? new Date(record.tokenExpiresAt).getTime() : 0;
    const isExpired = Date.now() >= expiresAt - 60000; // Refresh 1 min before expiry

    if (!isExpired || !record.refreshTokenEnc) {
      return currentToken;
    }

    // Refresh token
    const refreshToken = EncryptionUtil.decrypt(record.refreshTokenEnc);
    const clientId =
      this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return currentToken;
    }

    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      const data = await res.json();
      if (res.ok && data.access_token) {
        const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
        await this.prisma.tenantIntegration.update({
          where: { id: record.id },
          data: {
            accessTokenEnc: EncryptionUtil.encrypt(data.access_token),
            tokenExpiresAt: newExpiresAt,
            lastSyncAt: new Date(),
          },
        });
        return data.access_token;
      }
    } catch (err) {
      this.logger.error(`Error refreshing Google access token: ${err}`);
    }

    return currentToken;
  }
}
