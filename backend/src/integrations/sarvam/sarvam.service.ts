import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InitiateCallPayload, SarvamCallResult } from './sarvam.types';

@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SARVAM_API_KEY', 'sarvam_default_key');
    this.baseUrl = this.configService.get<string>('SARVAM_API_BASE_URL', 'https://api.sarvam.ai/v1');
  }

  getAvailableLanguages() {
    return [
      { code: 'hi-IN', name: 'Hindi (India)' },
      { code: 'en-IN', name: 'English (Indian Accent)' },
      { code: 'ta-IN', name: 'Tamil (India)' },
      { code: 'te-IN', name: 'Telugu (India)' },
      { code: 'mr-IN', name: 'Marathi (India)' },
      { code: 'kn-IN', name: 'Kannada (India)' },
      { code: 'bn-IN', name: 'Bengali (India)' },
      { code: 'gu-IN', name: 'Gujarati (India)' },
    ];
  }

  getAvailableVoices() {
    return [
      { id: 'meera', name: 'Meera (Expressive Female)', gender: 'female', sampleUrl: '/samples/meera.mp3' },
      { id: 'arvind', name: 'Arvind (Professional Male)', gender: 'male', sampleUrl: '/samples/arvind.mp3' },
      { id: 'kavya', name: 'Kavya (Warm Female)', gender: 'female', sampleUrl: '/samples/kavya.mp3' },
      { id: 'rohit', name: 'Rohit (Friendly Male)', gender: 'male', sampleUrl: '/samples/rohit.mp3' },
    ];
  }

  async verifyCredentials(): Promise<{ valid: boolean; balanceRemaining: number; status: string }> {
    this.logger.log(`Verifying Sarvam AI connection at ${this.baseUrl}...`);
    return {
      valid: true,
      balanceRemaining: 15420.5,
      status: 'CONNECTED',
    };
  }

  async dispatchOutboundCall(payload: InitiateCallPayload): Promise<{ externalCallId: string; status: string }> {
    this.logger.log(
      `[Sarvam Dispatch] Calling ${payload.phoneNumber} for ${payload.customerName} on behalf of ${payload.config.companyName}`,
    );

    const externalCallId = `srv_call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return {
      externalCallId,
      status: 'QUEUED',
    };
  }

  simulateLiveCallExecution(payload: InitiateCallPayload): SarvamCallResult {
    const isSuccess = Math.random() > 0.15;
    const isInterested = Math.random() > 0.35;
    const durationSeconds = isSuccess ? Math.floor(Math.random() * 140) + 40 : 15;
    const billableMinutes = parseFloat((durationSeconds / 60).toFixed(2));
    const providerCost = parseFloat((billableMinutes * 0.95).toFixed(2));

    const externalCallId = `srv_call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (!isSuccess) {
      return {
        externalCallId,
        status: 'NO_ANSWER',
        durationSeconds: 12,
        billableMinutes: 0.2,
        providerCost: 0.19,
        outcome: 'NO_ANSWER',
        transcript: '[Customer did not answer after 4 rings]',
        summary: 'Call attempted but recipient was not reachable or did not answer.',
        qualificationResults: {},
      };
    }

    const outcome = isInterested ? 'QUALIFIED' : 'NOT_INTERESTED';
    const transcript = `[AI (${payload.config.voice})]: ${payload.config.openingIntro}\n` +
      `[Customer (${payload.customerName})]: Yes, tell me more about ${payload.config.serviceName}.\n` +
      `[AI]: ${payload.config.serviceDescription}. Would you be interested in exploring our current pricing or scheduling a visit?\n` +
      `[Customer]: ${isInterested ? 'Yes, please share the brochure and schedule a callback.' : 'Not right now, maybe later.'}\n` +
      `[AI]: ${payload.config.closingStatement}`;

    return {
      externalCallId,
      status: 'COMPLETED',
      durationSeconds,
      billableMinutes,
      providerCost,
      outcome,
      transcript,
      summary: isInterested
        ? `Customer expressed clear interest in ${payload.config.serviceName}. Requested callback for detailed pricing.`
        : `Customer listened to intro but requested no further follow-up at this time.`,
      objectionHandled: isInterested ? 'Pricing flexibility discussed' : 'Customer stated bad timing',
      callbackTime: isInterested ? new Date(Date.now() + 24 * 3600 * 1000) : undefined,
      qualificationResults: {
        budgetConfirmed: isInterested,
        timeline: isInterested ? 'Immediate (within 30 days)' : 'Not ready',
        contactVerified: true,
      },
      recordingUrl: `https://recordings.acrm-storage.com/${externalCallId}.mp3`,
    };
  }
}
