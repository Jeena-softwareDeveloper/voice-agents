import { Controller, Get, Post, Put, Delete, Body, UseGuards, Query, Param, Headers, BadRequestException } from '@nestjs/common';
import {
  AiCallingService,
  UpdateVoicePreferencesDto,
  UpdateServiceKnowledgeDto,
} from '../../services/ai-calling/ai-calling.service';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';
import { TelephonyService, NumberRequestPayload } from '../../integrations/telephony/telephony.service';
import { DispatchCallDto, BulkDispatchCallDto } from '../../dto/call.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';
import { TestScenarioType } from '../../integrations/sarvam/sarvam.types';

@Controller('ai-calling')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AiCallingController {
  constructor(
    private aiCallingService: AiCallingService,
    private sarvamService: SarvamService,
    private telephonyService: TelephonyService,
  ) {}

  /**
   * Client AI Calling Overview: Stats, assigned numbers, voice prefs, warnings
   */
  @Get('overview')
  async getTenantOverview(@CurrentTenant() tenantId: string) {
    return this.aiCallingService.getTenantOverview(tenantId);
  }

  /**
   * Get supported Sarvam Voice Agents configuration info
   */
  @Get('options')
  async getAiCallingOptions() {
    return {
      defaultProvider: 'Sarvam Voice Agents (Saaras v4 + Bulbul V4 + Managed LLM)',
      asrModel: 'saaras:v4',
      ttsModel: 'bulbul:v4',
      isConfigured: this.sarvamService.isConfigured(),
    };
  }

  /**
   * Get tenant custom voice and conversation preferences
   */
  @Get('voice-preferences')
  async getVoicePreferences(@CurrentTenant() tenantId: string) {
    return this.aiCallingService.getVoicePreferences(tenantId);
  }

  /**
   * Update tenant voice and conversation preferences
   */
  @Put('voice-preferences')
  async updateVoicePreferences(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateVoicePreferencesDto,
  ) {
    return this.aiCallingService.updateVoicePreferences(tenantId, dto);
  }

  /**
   * Voice preview (managed through Sarvam Voice Agents runtime)
   */
  @Post('preview-voice')
  async previewVoiceSample(
    @Body() body: { text: string; voice?: string; language?: string },
  ) {
    return {
      message: 'Voice preview is handled directly by official Sarvam Voice Agents Bulbul V4 runtime in the Test Agent.',
      audioUrl: '',
      durationSeconds: 0,
      characterCount: body.text?.length || 0,
    };
  }

  /**
   * Synthesize real speech via centralized Sarvam Bulbul V3/V4
   */
  @Post('synthesize-speech')
  async synthesizeSpeech(
    @Body() body: { text: string; language?: string; speaker?: string; model?: string },
  ) {
    if (!body?.text?.trim()) {
      throw new BadRequestException('Speech synthesis text input cannot be empty.');
    }
    return this.sarvamService.synthesizeSpeech(
      body.text.trim(),
      body.language || 'hi-IN',
      body.speaker || 'kavya',
      body.model || 'bulbul:v3',
    );
  }

  /**
   * Client Phone Numbers: Current assigned number + available numbers to purchase
   */
  @Get('phone-numbers')
  async getPhoneNumbers(@CurrentTenant() tenantId: string) {
    const assigned = await this.telephonyService.getTenantNumber(tenantId);
    const available = await this.telephonyService.getAvailableNumbers();
    return {
      assigned,
      available,
    };
  }

  /**
   * Request / Purchase an eligible phone number (or submit BYOT request)
   */
  @Post('phone-numbers/request')
  async requestPhoneNumber(
    @CurrentTenant() tenantId: string,
    @Body() payload: NumberRequestPayload,
  ) {
    return this.telephonyService.requestNumber(tenantId, payload);
  }

  @Delete('phone-numbers/:numberId')
  async releaseTenantNumber(
    @CurrentTenant() tenantId: string,
    @Param('numberId') numberId: string,
  ) {
    const assigned = await this.telephonyService.getTenantNumber(tenantId);
    if (!assigned || assigned.id !== numberId) {
      throw new BadRequestException('This phone number is not assigned to your account.');
    }
    return this.telephonyService.releaseNumber(numberId);
  }

  /**
   * Top-Up AI Calling Credits
   */
  @Post('credits/topup')
  async topUpCredits(
    @CurrentTenant() tenantId: string,
    @Body() body: { amount: number },
  ) {
    return this.aiCallingService.topUpCredits(tenantId, body.amount || 1000);
  }

  /**
   * Dispatch single outbound AI call with Sarvam Voice Agents
   */
  @Post('dispatch')
  async dispatchSingleCall(@CurrentTenant() tenantId: string, @Body() dto: DispatchCallDto) {
    return this.aiCallingService.dispatchCall(tenantId, dto.leadId);
  }

  /**
   * Bulk Dispatch outbound AI calls
   */
  @Post('bulk-dispatch')
  async bulkDispatch(@CurrentTenant() tenantId: string, @Body() dto: BulkDispatchCallDto) {
    return this.aiCallingService.bulkDispatchCalls(tenantId, dto.leadIds);
  }

  /**
   * Service Knowledge Base & FAQs Management
   */
  @Get('knowledge-base/:serviceId')
  async getServiceKnowledge(
    @CurrentTenant() tenantId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.aiCallingService.getServiceKnowledgeBase(tenantId, serviceId);
  }

  @Put('knowledge-base/:serviceId')
  async updateServiceKnowledge(
    @CurrentTenant() tenantId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceKnowledgeDto,
  ) {
    return this.aiCallingService.updateServiceKnowledgeBase(tenantId, serviceId, dto);
  }

  /**
   * AI Voice Quality Testing & Interactive Simulator Endpoint
   */
  @Post('simulate-test')
  async runSimulator(
    @CurrentTenant() tenantId: string,
    @Body() body: { scenario: TestScenarioType; leadId?: string },
  ) {
    return this.aiCallingService.runTestScenario(tenantId, body.scenario || 'NATURAL_TAMIL', body.leadId);
  }

  /**
   * Sarvam Voice Agents Dashboard: Agent Metadata & Blueprint
   */
  @Get('test-session/agent-meta/:serviceId')
  async getAgentMetadata(
    @CurrentTenant() tenantId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.aiCallingService.getAgentMetadata(tenantId, serviceId);
  }

  /**
   * Initiate Real-Time Sarvam Test Session (Voice / Phone / Chat)
   */
  @Post('test-session/initiate')
  async initiateTestSession(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      serviceId: string;
      mode: 'voice' | 'phone' | 'chat';
      version?: string;
      language?: string;
      voice?: string;
      testPhone?: string;
      variables?: Record<string, any>;
    },
  ) {
    return this.aiCallingService.initiateTestSession(tenantId, body);
  }

  /**
   * Save Completed Test Session with Transcripts & Output Variables
   */
  @Post('test-session/save')
  async saveTestSession(
    @CurrentTenant() tenantId: string,
    @Body() sessionData: any,
  ) {
    return this.aiCallingService.saveTestSession(tenantId, sessionData);
  }

  /**
   * Retrieve Past Test Sessions
   */
  @Get('test-session/history')
  async getTestSessionHistory(
    @CurrentTenant() tenantId: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.aiCallingService.getTestSessionHistory(tenantId, serviceId);
  }

  /**
   * Outbound Telephony Phone Test Call
   */
  @Post('test-session/phone-call')
  async dispatchPhoneTest(
    @CurrentTenant() tenantId: string,
    @Body() body: { serviceId: string; testPhoneNumber: string; customerName?: string },
  ) {
    return this.aiCallingService.dispatchPhoneTest(tenantId, body);
  }

  /**
   * Asynchronous Webhook Endpoint for Sarvam Voice Agents Post-Call Results
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('x-sarvam-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.aiCallingService.handleSarvamWebhook(signature || '', payload);
  }
}
