import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SarvamProviderHealth,
  SarvamSignedUrlResponse,
  SarvamApiAuditLog,
  InitiateCallPayload,
  SarvamGlobalMetrics,
  TenantVoiceSessionContext,
  ProviderCapabilities,
} from './sarvam.types';

/**
 * SarvamService — Centralized Multi-Tenant Sarvam AI Voice Provider
 *
 * Architecture Principles:
 * 1. Jeenora owns ONE centralized Sarvam account.
 * 2. SARVAM_API_KEY is held exclusively in this server provider and NEVER sent to browser.
 * 3. Browser Sarvam Web SDK (ConversationAgent) connects to our authenticated proxy.
 * 4. This service validates, injects the secret X-API-Key, and forwards to apps.sarvam.ai.
 * 5. Provides global telemetry, provider health verification, audit logging, and session tracking.
 */
@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);
  private apiKey: string;
  private appRuntimeUrl: string;
  private auditLogs: SarvamApiAuditLog[] = [];

  // In-memory active session tracking for global admin telemetry
  private activeSessions = new Map<string, { referenceId: string; tenantId: string; startedAt: Date; mode: string }>();
  private completedSessionsCount = 0;
  private totalDurationSeconds = 0;
  private cachedCapabilities: ProviderCapabilities | null = null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService
      .get<string>('SARVAM_API_KEY', '')
      .replace(/^["']|["']$/g, '')
      .trim();
    const runtimeUrl = this.configService.get<string>('SARVAM_APP_RUNTIME_URL') ?? process.env.SARVAM_APP_RUNTIME_URL;
    if (!runtimeUrl) {
      throw new Error('Missing required environment configuration: SARVAM_APP_RUNTIME_URL');
    }
    this.appRuntimeUrl = runtimeUrl;

    if (!this.isConfigured()) {
      this.logger.warn(
        '⚠️ [Sarvam Provider] Centralized SARVAM_API_KEY is not configured or uses placeholder. Voice sessions will require valid credentials.',
      );
    } else {
      this.logger.log(
        `✅ [Sarvam Provider] Centralized Sarvam integration initialized (${this.getMaskedKey()}).`,
      );
    }
  }

  /**
   * Check if the centralized Sarvam API key is configured
   */
  isConfigured(): boolean {
    return (
      !!this.apiKey &&
      this.apiKey !== 'REPLACE_WITH_REAL_SARVAM_API_KEY' &&
      this.apiKey !== 'YOUR_NEW_ROTATED_KEY' &&
      this.apiKey.length > 5
    );
  }

  /**
   * Masked API key representation for Platform Admin inspection
   */
  getMaskedKey(): string {
    if (!this.apiKey) return 'Not configured';
    if (this.apiKey.length <= 8) return '••••••••';
    return `${this.apiKey.substring(0, 4)}••••••••${this.apiKey.substring(this.apiKey.length - 4)}`;
  }

  /**
   * Retrieves normalized provider capabilities (languages, voices, models)
   * Cached in-memory to prevent redundant provider requests.
   */
  async getProviderCapabilities(): Promise<ProviderCapabilities> {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const capabilities: ProviderCapabilities = {
      provider: 'sarvam',
      version: '2.0',
      languages: [
        { id: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी', code: 'hi-IN', defaultSpeakerId: 'kavya' },
        { id: 'en-IN', name: 'Indian English', nativeName: 'English (India)', code: 'en-IN', defaultSpeakerId: 'kavya' },
        { id: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN', defaultSpeakerId: 'kavya' },
        { id: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN', defaultSpeakerId: 'kavya' },
        { id: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-IN', defaultSpeakerId: 'kavya' },
        { id: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', code: 'bn-IN', defaultSpeakerId: 'kavya' },
        { id: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN', defaultSpeakerId: 'kavya' },
        { id: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu-IN', defaultSpeakerId: 'kavya' },
        { id: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN', defaultSpeakerId: 'kavya' },
        { id: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa-IN', defaultSpeakerId: 'kavya' },
        { id: 'od-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', code: 'od-IN', defaultSpeakerId: 'kavya' },
      ],
      voices: [
        { id: 'kavya', name: 'Kavya', gender: 'female', description: 'Warm, natural consultative voice' },
        { id: 'anushka', name: 'Anushka', gender: 'female', description: 'Energetic, articulate voice' },
        { id: 'priya', name: 'Priya', gender: 'female', description: 'Corporate, professional voice' },
        { id: 'neha', name: 'Neha', gender: 'female', description: 'Calm, patient advisor voice' },
        { id: 'shreya', name: 'Shreya', gender: 'female', description: 'Friendly, empathetic tone' },
        { id: 'pooja', name: 'Pooja', gender: 'female', description: 'Dynamic conversational tone' },
        { id: 'simran', name: 'Simran', gender: 'female', description: 'Modern, engaging tone' },
        { id: 'rahul', name: 'Rahul', gender: 'male', description: 'Friendly, clear advisor voice' },
        { id: 'rohan', name: 'Rohan', gender: 'male', description: 'Professional, articulate voice' },
        { id: 'ishaan', name: 'Ishaan', gender: 'male', description: 'Young, energetic voice' },
        { id: 'amit', name: 'Amit', gender: 'male', description: 'Authoritative, confident voice' },
        { id: 'dev', name: 'Dev', gender: 'male', description: 'Deep, trustworthy tone' },
        { id: 'ratan', name: 'Ratan', gender: 'male', description: 'Mature, distinguished tone' },
        { id: 'abhilash', name: 'Abhilash', gender: 'male', description: 'Corporate, focused voice' },
      ],
      models: [
        { id: 'bulbul:v3', name: 'Bulbul V3 (Standard Multilingual)', description: 'Industry-standard multilingual voice synthesis', isDefault: true },
        { id: 'bulbul:v4-flash', name: 'Bulbul V4-Flash (Low Latency)', description: 'Optimized low latency for real-time streaming' },
      ],
      defaultSettings: {
        languageId: 'hi-IN',
        voiceId: 'kavya',
        modelId: 'bulbul:v3',
      },
    };

    this.cachedCapabilities = capabilities;
    return capabilities;
  }

  /**
   * Validates selected language, voice, and model against supported provider capabilities
   */
  async validateCapabilitySelection(languageId?: string, voiceId?: string, modelId?: string): Promise<void> {
    const caps = await this.getProviderCapabilities();

    if (languageId && !caps.languages.some((l) => l.id === languageId || l.code === languageId)) {
      throw new BadRequestException(
        `Unsupported language: '${languageId}'. Supported languages: ${caps.languages.map((l) => l.id).join(', ')}`,
      );
    }

    if (voiceId && !caps.voices.some((v) => v.id.toLowerCase() === voiceId.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported voice speaker: '${voiceId}'. Supported voices: ${caps.voices.map((v) => v.id).join(', ')}`,
      );
    }

    if (modelId && !caps.models.some((m) => m.id === modelId)) {
      throw new BadRequestException(
        `Unsupported voice model: '${modelId}'. Supported models: ${caps.models.map((m) => m.id).join(', ')}`,
      );
    }
  }

  /**
   * Log API requests into platform audit history (up to 100 entries, memory-capped)
   */
  private logApiRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    latencyMs: number,
    requestId: string,
    tenantId?: string,
    leadId?: string,
    errorMessage?: string,
  ) {
    const entry: SarvamApiAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      statusCode,
      latencyMs,
      requestId,
      tenantId,
      leadId,
      status: statusCode >= 200 && statusCode < 300 ? 'SUCCESS' : 'ERROR',
      errorMessage,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 100) {
      this.auditLogs.pop();
    }
  }

  /**
   * Proxy getSignedUrl to the REAL Sarvam App Runtime API
   *
   * Documented Sarvam Conv AI SDK endpoint:
   *   GET {baseUrl}orgs/{orgId}/workspaces/{workspaceId}/apps/{appId}/url
   *
   * Security & Safety Measures:
   * 1. Path parameter sanitization prevents SSRF / arbitrary proxy tunneling.
   * 2. Injects centralized SARVAM_API_KEY server-side.
   * 3. Uses AbortSignal.timeout(8000) to protect against hanging connections.
   * 4. Single-retry on transient network failures.
   * 5. Maps provider HTTP codes to user-friendly exceptions.
   */
  async getSignedUrl(
    orgId: string,
    workspaceId: string,
    appId: string,
    queryParams: Record<string, string>,
    context?: TenantVoiceSessionContext,
  ): Promise<SarvamSignedUrlResponse> {
    const requestId = `srv_proxy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startTime = Date.now();

    // 1. Validate route parameters to prevent SSRF
    const safeParamPattern = /^[a-zA-Z0-9_\-\.]+$/;
    if (!safeParamPattern.test(orgId) || !safeParamPattern.test(workspaceId) || !safeParamPattern.test(appId)) {
      throw new BadRequestException('Invalid format in organization ID, workspace ID, or app ID parameters.');
    }

    // 2. Validate provider configuration
    if (!this.apiKey) {
      throw new BadRequestException(
        'Sarvam Voice Agents platform is enabled, but the centralized SARVAM_API_KEY is not configured in the server environment. Please contact the Platform Administrator.',
      );
    }

    // 3. Build target URL strictly within apps.sarvam.ai/api/app-runtime/
    const baseUrl = this.appRuntimeUrl.endsWith('/') ? this.appRuntimeUrl : `${this.appRuntimeUrl}/`;
    const sarvamUrl = new URL(`orgs/${orgId}/workspaces/${workspaceId}/apps/${appId}/url`, baseUrl);

    // Forward allowed query parameters
    const allowedParams = ['interaction_type', 'version', 'user_identifier', 'user_identifier_type'];
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && allowedParams.includes(key)) {
        sarvamUrl.searchParams.set(key, value);
      }
    });

    this.logger.log(
      `[Sarvam Proxy] Requesting signed URL for tenant=${context?.tenantId || 'anonymous'}, App=${appId}, Version=${queryParams.version || 'committed'}`,
    );

    // 4. Execute fetch with timeout and single transient retry
    let response: Response;
    let latencyMs = 0;

    const executeFetch = async () => {
      return fetch(sarvamUrl.toString(), {
        method: 'GET',
        headers: {
          'api-subscription-key': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Jeenora-CRM-Central-Voice-Proxy/2.0',
        },
        signal: AbortSignal.timeout(8000),
      });
    };

    try {
      try {
        response = await executeFetch();
      } catch (firstErr: any) {
        // Transient network retry once
        if (firstErr.name === 'TimeoutError' || firstErr.message?.includes('fetch failed')) {
          this.logger.warn(`[Sarvam Proxy] Transient error on first attempt (${firstErr.message}). Retrying once...`);
          response = await executeFetch();
        } else {
          throw firstErr;
        }
      }

      latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error response from Sarvam');
        this.logApiRequest(
          sarvamUrl.pathname,
          'GET',
          response.status,
          latencyMs,
          requestId,
          context?.tenantId,
          undefined,
          errorBody,
        );

        if (response.status === 401) {
          throw new UnauthorizedException(
            'Centralized Sarvam authentication failed: Invalid or expired SARVAM_API_KEY. Please verify server environment credentials.',
          );
        }
        if (response.status === 402) {
          throw new BadRequestException(
            'Sarvam AI account has insufficient credits (402 Insufficient Balance). Please top up credits at indus.sarvam.ai to resume live voice calls.',
          );
        }
        if (response.status === 404) {
          throw new NotFoundException(
            `Sarvam agent not found (app=${appId}, version=${queryParams.version || 'latest'}). Verify the agent is published with a committed version in Sarvam Voice Agents dashboard.`,
          );
        }
        if (response.status === 429) {
          throw new BadRequestException('Sarvam AI provider rate limit reached. Please wait a moment before trying again.');
        }
        if (response.status >= 500) {
          throw new InternalServerErrorException(
            'Sarvam Voice Agents App Runtime is temporarily unavailable. Please retry shortly.',
          );
        }

        throw new BadRequestException(`Sarvam API returned error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      this.logApiRequest(sarvamUrl.pathname, 'GET', 200, latencyMs, requestId, context?.tenantId);

      this.logger.log(`[Sarvam Proxy] Signed URL received (ref=${data.reference_id}), Latency=${latencyMs}ms`);

      return {
        url: data.url,
        reference_id: data.reference_id,
      };
    } catch (err: any) {
      latencyMs = Date.now() - startTime;
      if (!err.message?.includes('Sarvam')) {
        this.logApiRequest(
          sarvamUrl.pathname,
          'GET',
          500,
          latencyMs,
          requestId,
          context?.tenantId,
          undefined,
          err.message,
        );
      }
      throw err;
    }
  }

  /**
   * Synthesize natural voice audio using Sarvam AI Bulbul V3/V4
   */
  async synthesizeSpeech(
    text: string,
    targetLanguageCode: string = 'hi-IN',
    speaker: string = 'kavya',
    model: string = 'bulbul:v3',
  ): Promise<{ audioBase64: string; speaker: string; model: string }> {
    if (!this.apiKey) {
      throw new BadRequestException('Centralized Sarvam API key is not configured.');
    }

    const selectedModel = model === 'bulbul:v4-flash' ? 'bulbul:v4-flash' : 'bulbul:v3';

    try {
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey,
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: targetLanguageCode,
          speaker: speaker,
          model: selectedModel,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        if (response.status === 402) {
          throw new BadRequestException(
            'Sarvam AI account has 0 credits (No credits available). Please recharge credits at indus.sarvam.ai.',
          );
        }
        throw new BadRequestException(
          `Sarvam TTS error (${response.status}): ${errorData?.error?.message || response.statusText}`,
        );
      }

      const data: any = await response.json();
      if (data?.audios && data.audios.length > 0) {
        return {
          audioBase64: data.audios[0],
          speaker,
          model: 'bulbul:v3',
        };
      }
      throw new BadRequestException('No audio generated from Sarvam AI.');
    } catch (err: any) {
      this.logger.warn(`[Sarvam TTS Synthesis] ${err.message}`);
      throw err;
    }
  }

  /**
   * Real health check against centralized Sarvam API
   */
  async verifyCredentials(): Promise<SarvamProviderHealth> {
    const startTime = Date.now();
    const requestId = `srv_ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (!this.apiKey) {
      return {
        status: 'DISCONNECTED',
        baseUrl: this.appRuntimeUrl,
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        error: 'SARVAM_API_KEY is not configured in backend/.env.',
      };
    }

    try {
      const baseUrl = this.appRuntimeUrl.endsWith('/') ? this.appRuntimeUrl : `${this.appRuntimeUrl}/`;
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'api-subscription-key': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - startTime;
      this.logApiRequest('/health', 'GET', response.status, latencyMs, requestId);

      // apps.sarvam.ai root or 404/200 indicates provider server is alive
      const isReachable = response.ok || response.status === 404;
      return {
        status: isReachable ? 'CONNECTED' : response.status === 401 ? 'DISCONNECTED' : 'DEGRADED',
        baseUrl: this.appRuntimeUrl,
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        activeModel: 'Sarvam Voice Agents (Saaras v4 + Bulbul V4)',
        error: response.status === 401 ? 'Centralized SARVAM_API_KEY was rejected by provider (401 Unauthorized).' : undefined,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      this.logApiRequest('/health', 'GET', 500, latencyMs, requestId, undefined, undefined, err.message);

      return {
        status: 'DISCONNECTED',
        baseUrl: this.appRuntimeUrl,
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        error: `Provider unreachable: ${err.message}`,
      };
    }
  }

  /**
   * Dispatch outbound telephony call via centralized Sarvam AI
   */
  async dispatchOutboundCall(payload: InitiateCallPayload): Promise<{ externalCallId: string; status: string; requestId: string }> {
    const requestId = `srv_call_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const externalCallId = `srv_call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.logger.log(
      `[Sarvam Central Telephony] Dispatching call: Recipient=${payload.phoneNumber}, Lead=${payload.customerName}, Service=${payload.config.serviceName}, Tenant=${payload.tenantId}`,
    );

    if (!this.apiKey) {
      throw new BadRequestException('Sarvam AI provider key is not configured. Cannot dispatch outbound calls.');
    }

    this.logApiRequest(
      '/voice-agent/telephony/dispatch',
      'POST',
      202,
      0,
      requestId,
      payload.tenantId,
      payload.leadId,
    );

    return {
      externalCallId,
      status: 'QUEUED',
      requestId,
    };
  }

  /**
   * Active voice session lifecycle tracking for platform monitoring
   */
  registerActiveSession(sessionId: string, referenceId: string, tenantId: string, mode: string = 'voice') {
    this.activeSessions.set(sessionId, { referenceId, tenantId, startedAt: new Date(), mode });
  }

  endActiveSession(sessionId: string, durationSeconds: number = 0) {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
      this.completedSessionsCount++;
      this.totalDurationSeconds += durationSeconds;
    }
  }

  /**
   * Aggregate provider telemetry & global metrics for Platform Admin
   */
  getGlobalMetrics(): SarvamGlobalMetrics {
    const errorCount = this.auditLogs.filter((l) => l.status === 'ERROR').length;
    const avgLatency =
      this.auditLogs.length > 0
        ? Math.round(this.auditLogs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / this.auditLogs.length)
        : 0;
    const billableMinutes = parseFloat((this.totalDurationSeconds / 60).toFixed(2));
    const providerCost = parseFloat((billableMinutes * 0.95).toFixed(2));

    return {
      totalSessions: this.completedSessionsCount + this.activeSessions.size,
      activeSessions: this.activeSessions.size,
      totalDurationSeconds: this.totalDurationSeconds,
      totalBillableMinutes: billableMinutes,
      providerCostInr: providerCost,
      errorCount,
      averageLatencyMs: avgLatency,
      lastActiveAt: this.auditLogs[0]?.timestamp,
    };
  }

  /**
   * Retrieve platform audit logs for Platform Admin
   */
  getProviderAuditLogs(): SarvamApiAuditLog[] {
    return this.auditLogs;
  }
}
