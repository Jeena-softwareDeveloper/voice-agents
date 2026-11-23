// ============================================================
// Sarvam Voice Agents — Official Types (Zero Hardcoded Content)
// ============================================================

export interface VoiceProviderLanguage {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  defaultSpeakerId?: string;
}

export interface VoiceProviderSpeaker {
  id: string;
  name: string;
  gender: 'female' | 'male';
  description?: string;
  supportedLanguages?: string[];
}

export interface VoiceProviderModel {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export interface ProviderCapabilities {
  provider: 'sarvam';
  version: string;
  languages: VoiceProviderLanguage[];
  voices: VoiceProviderSpeaker[];
  models: VoiceProviderModel[];
  defaultSettings: {
    languageId: string;
    voiceId: string;
    modelId: string;
  };
}

/**
 * Sarvam Agent Configuration stored per service/tenant
 * Maps to the actual Sarvam Voice Agents dashboard entities
 */
export interface SarvamAgentConfig {
  id: string;
  tenantId: string;
  serviceId: string;
  sarvamOrgId: string;
  sarvamWorkspaceId: string;
  sarvamAppId: string;
  committedVersion?: number;
  status: 'CONFIGURED' | 'PENDING' | 'ERROR';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response from Sarvam's getSignedUrl endpoint
 */
export interface SarvamSignedUrlResponse {
  url: string;
  reference_id: string;
}

export type TestScenarioType = string;

/**
 * Platform provider health check result
 */
export interface SarvamProviderHealth {
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  baseUrl: string;
  latencyMs: number;
  lastCheckedAt: string;
  availableCredits?: number;
  activeModel?: string;
  error?: string;
}

/**
 * Qualification question configuration (tenant-managed)
 */
export type QualificationAnswerType =
  | 'TEXT'
  | 'NUMBER'
  | 'CURRENCY'
  | 'DATE'
  | 'BOOLEAN'
  | 'SINGLE_SELECT'
  | 'MULTI_SELECT'
  | 'LOCATION'
  | 'PHONE'
  | 'EMAIL';

export interface QualificationQuestionConfig {
  id: string;
  question: string;
  expectedAnswerType: QualificationAnswerType | 'yes_no' | 'budget' | 'timeline' | 'text' | 'choice';
  options?: string[];
  required?: boolean;
  fieldKey?: string;
}

/**
 * Service knowledge item (tenant-managed FAQ)
 */
export interface ServiceKnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category: 'PRICING' | 'LEGAL_APPROVALS' | 'LOCATION' | 'AMENITIES' | 'FINANCING' | 'GENERAL';
}

/**
 * Pronunciation dictionary entry (tenant-managed)
 */
export interface PronunciationEntry {
  word: string;
  phonetic: string;
  notes?: string;
}

/**
 * Conversation configuration for outbound calls
 * (retained for call dispatch and reconciliation)
 */
export interface SarvamConversationConfig {
  companyName: string;
  serviceName: string;
  serviceCategory?: string;
  serviceDescription: string;
  openingIntro: string;
  language: string;
  voice: string;
  engine?: 'bulbul:v4';
  asrEngine?: 'saaras:v4';
  speakingSpeed?: number;
  conversationTone?: string;
  maxDurationSeconds: number;
  bargeInEnabled?: boolean;
  silenceThresholdMs?: number;
  responseDelayMs?: number;
  transparentAiDisclosure?: boolean;
  tanglishEnabled?: boolean;
  quietCallerNudge?: {
    enabled: boolean;
    delaySeconds: number;
    prompt: string;
  };
  humanHandoff?: {
    enabled: boolean;
    transferNumber?: string;
    assignedRepName?: string;
    triggers: string[];
  };
  knowledgeBase?: ServiceKnowledgeItem[];
  pricingGuidelines?: string;
  disallowedTopics?: string;
  qualificationQuestions: QualificationQuestionConfig[];
  approvedResponses: Record<string, string>;
  objectionHandling: Record<string, string>;
  closingStatement: string;
  pronunciationDictionary?: PronunciationEntry[];
}

/**
 * Extracted customer requirements from AI call
 */
export interface ExtractedCustomerRequirements {
  [key: string]: any;
  budget?: string;
  preferredLocation?: string;
  timeline?: string;
  requirementType?: string;
  appointmentDate?: string;
  financingNeeded?: boolean;
  notes?: string;
}

/**
 * Tool execution record from Sarvam agent
 */
export interface SarvamToolExecution {
  toolName: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  timestamp: string;
}

/**
 * Human handoff event
 */
export interface HumanHandoffEvent {
  requested: boolean;
  reason?: string;
  transferredToLiveRep?: boolean;
  transferNumber?: string;
  urgentCallbackScheduled?: boolean;
  repName?: string;
}

/**
 * Conversation turn
 */
export interface ConversationTurn {
  speaker: 'ai' | 'customer';
  text: string;
  timestampSeconds: number;
  interrupted?: boolean;
  sentiment?: 'positive' | 'neutral' | 'skeptical' | 'frustrated';
}

/**
 * Call dispatch payload
 */
export interface InitiateCallPayload {
  callId: string;
  tenantId: string;
  leadId: string;
  phoneNumber: string;
  customerName: string;
  callerNumber?: string;
  previousEnquiryDetails?: string;
  previousCallNotes?: string;
  leadStage?: string;
  config: SarvamConversationConfig;
}

/**
 * Call result from Sarvam
 */
export interface SarvamCallResult {
  externalCallId: string;
  status: 'COMPLETED' | 'FAILED' | 'BUSY' | 'NO_ANSWER';
  durationSeconds: number;
  billableMinutes: number;
  providerCost: number;
  outcome:
    | 'ANSWERED'
    | 'INTERESTED'
    | 'NOT_INTERESTED'
    | 'CALLBACK_REQUESTED'
    | 'DEMO_REQUESTED'
    | 'QUALIFIED'
    | 'OPTED_OUT'
    | 'BUSY'
    | 'NO_ANSWER'
    | 'FAILED'
    | 'HUMAN_HANDOFF_REQUESTED';
  transcript: string;
  summary: string;
  objectionHandled?: string;
  callbackTime?: Date;
  qualificationResults: Record<string, any>;
  extractedRequirements: ExtractedCustomerRequirements;
  humanHandoff?: HumanHandoffEvent;
  toolExecutions?: SarvamToolExecution[];
  interruptionCount: number;
  qualityScore: number;
  customerSentiment: 'POSITIVE' | 'NEUTRAL' | 'SKEPTICAL' | 'FRUSTRATED';
  recordingUrl?: string;
  modelsUsed: {
    asr: 'saaras:v4';
    tts: 'bulbul:v4';
    llm: 'sarvam-managed-agent-v1';
  };
}

/**
 * API audit log
 */
export interface SarvamApiAuditLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  requestId: string;
  tenantId?: string;
  leadId?: string;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
}

/**
 * Test session record
 */
export interface TestSessionRecord {
  id: string;
  tenantId: string;
  serviceId: string;
  serviceName: string;
  agentVersion: string;
  mode: 'voice' | 'phone' | 'chat';
  language: string;
  voice: string;
  durationSeconds: number;
  transcript: Array<{ role: 'user' | 'bot'; content: string; timestamp: number; interrupted?: boolean }>;
  outputVariables: Record<string, any>;
  createdAt: string;
  scenario?: string;
  audioQualityScore?: number;
  disposition?: string;
}

/**
 * Global Sarvam provider telemetry and aggregate metrics for platform admin
 */
export interface SarvamGlobalMetrics {
  totalSessions: number;
  activeSessions: number;
  totalDurationSeconds: number;
  totalBillableMinutes: number;
  providerCostInr: number;
  errorCount: number;
  averageLatencyMs: number;
  lastActiveAt?: string;
}

/**
 * Tenant voice session context passed to the central provider
 */
export interface TenantVoiceSessionContext {
  tenantId: string;
  userId?: string;
  serviceId?: string;
}

