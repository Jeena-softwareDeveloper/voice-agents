export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'TENANT_STAFF';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  businessType: string;
  country: string;
  state: string;
  city: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  aiCallingEnabled: boolean;
  monthlyCallingLimit: number;
  usedCallingMinutes: number;
  creditBalance?: number;
  dailyCallingLimit?: number;
  concurrencyLimit?: number;
  kycStatus?: string;
  createdAt: string;
  subscription?: {
    planName: string;
    status: string;
    callingLimitMinutes: number;
    validityUntil: string;
  };
  businessProfile?: {
    businessName: string;
    category: string;
    description: string;
  };
  _count?: {
    leads: number;
    calls: number;
    services: number;
    customers: number;
  };
}

export interface ServiceMarketingMaterial {
  id: string;
  tenantId: string;
  serviceId: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  fileUrl?: string;
  rawContent?: string;
  extractedData?: any;
  createdAt: string;
}

export interface ServiceFollowUpStage {
  id: string;
  tenantId: string;
  serviceId: string;
  order: number;
  name: string;
  triggerTiming: string;
  questions: any[];
  expectedResponse?: string;
  nextAction: string;
  callbackScheduling: boolean;
  meetingScheduling: boolean;
  retryLimit: number;
  stopConditions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description: string;
  location?: string;
  marketLocation?: string;
  pricingInfo?: string;
  additionalInfo?: string;
  extractedInfo?: any;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  serviceAiConfig?: ServiceAiConfig;
  marketingMaterials?: ServiceMarketingMaterial[];
  followUpStages?: ServiceFollowUpStage[];
  _count?: {
    leads: number;
    calls: number;
  };
}

export interface ServiceAiConfig {
  id: string;
  tenantId: string;
  serviceId: string;
  templateId?: string;
  openingIntro: string;
  companyIdentity: string;
  serviceDescription: string;
  instructions: string;
  qualificationQuestions: any[];
  approvedResponses: Record<string, string>;
  objectionHandling: Record<string, string>;
  talkingPoints?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  language: string;
  voice: string;
  maxDurationSeconds: number;
  closingStatement: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE';
  version: number;
}

export interface Contact {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  location?: string;
  consentGranted: boolean;
}

export interface Lead {
  id: string;
  tenantId: string;
  contactId: string;
  serviceId: string;
  leadSource: string;
  status: 'NEW_LEAD' | 'AI_CONTACTED' | 'QUALIFIED' | 'INTERESTED' | 'MEETING_SCHEDULED' | 'NEGOTIATION' | 'WON' | 'LOST';
  interestLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  aiCallingEligible: boolean;
  callAttempts: number;
  lastCallDate?: string;
  nextFollowUpDate?: string;
  qualificationNotes?: string;
  notes?: string;
  contact: Contact;
  service: Service;
  calls?: Call[];
  followUps?: FollowUp[];
  tenant?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface Call {
  id: string;
  tenantId: string;
  leadId: string;
  serviceId: string;
  callerNumber?: string;
  recipientNumber: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUSY' | 'NO_ANSWER' | 'CANCELLED';
  outcome?: 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED' | 'INTERESTED' | 'NOT_INTERESTED' | 'CALLBACK_REQUESTED' | 'DEMO_REQUESTED' | 'QUALIFIED' | 'OPTED_OUT';
  durationSeconds: number;
  billableSeconds: number;
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  objectionHandled?: string;
  costAmount: number;
  createdAt: string;
  lead?: Lead;
  service?: Service;
  tenant?: { id: string; name: string };
}

export interface FollowUp {
  id: string;
  tenantId: string;
  leadId?: string;
  contactId: string;
  serviceId?: string;
  stageId?: string;
  currentStage?: string;
  meetingStatus?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NOT_APPLICABLE' | string;
  assignedOwner?: string;
  callHistory?: Array<{
    date: string;
    duration: string;
    outcome: string;
    summary?: string;
  }>;
  title: string;
  description?: string;
  type: 'CALLBACK' | 'DEMO' | 'SITE_VISIT' | 'SALES_CALL' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  outcomeNotes?: string;
  contact: Contact;
  service?: { id: string; name: string; category?: string };
  stage?: { id: string; name: string; order?: number };
  lead?: {
    id?: string;
    service?: { name: string };
    calls?: Call[];
  };
}

export interface Customer {
  id: string;
  tenantId: string;
  contactId: string;
  primaryServiceId?: string;
  conversionDate: string;
  totalContractValue: number;
  status: string;
  notes?: string;
  contact: Contact & {
    leads?: Lead[];
    followUps?: FollowUp[];
  };
  primaryService?: Service;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  callingMinutes: number;
  callingCharges: number;
  subscriptionCharges: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  paidAt?: string;
  tenant?: { id: string; name: string; email: string };
  payments?: any[];
}

export interface TelephonyNumber {
  id: string;
  e164Number: string;
  number?: string;
  countryCode: string;
  countryName: string;
  country?: string;
  callingCode: string;
  region: string;
  numberType: string;
  type?: string;
  provider: string;
  monthlyRent: number;
  currency: string;
  status: string;
  providerStatus: string;
  assignedTenantId?: string | null;
  renewalDate: string;
  kycStatus: string;
  isByot: boolean;
  active: boolean;
  allocatedAt?: string | null;
  assignedAgentId?: string | null;
  assignedServiceName?: string | null;
  connectionId?: string | null;
  connectionName?: string | null;
  lastSynchronizedAt?: string;
}

export interface TelephonyConnection {
  id: string;
  name: string;
  providerType: 'SARVAM_MANAGED' | 'BYOT_SIP_TRUNK' | 'BYOT_CARRIER';
  providerName: string;
  status: string;
  isVerified: boolean;
  config?: any;
  lastVerifiedAt?: string | null;
  lastSyncAt?: string | null;
  phoneNumbersCount: number;
  createdAt: string;
}

export interface NumberCatalogItem {
  providerNumberId: string;
  e164Number: string;
  countryCode: string;
  countryName: string;
  callingCode: string;
  region?: string;
  numberType: 'LOCAL' | 'TOLL_FREE' | 'MOBILE' | 'NATIONAL';
  monthlyRent?: number;
  currency?: string;
  billingPeriod?: 'MONTHLY' | 'ANNUAL';
  features?: string[];
  kycRequired?: boolean;
}

export interface NumberCatalogResult {
  isSupported: boolean;
  status: 'SUPPORTED' | 'UNSUPPORTED_BY_PROVIDER' | 'ERROR';
  message?: string;
  items: NumberCatalogItem[];
  availableCountries?: Array<{ code: string; name: string; callingCode: string }>;
  availableTypes?: string[];
  total: number;
  page?: number;
  limit?: number;
}

export interface RegisterByotPayload {
  e164Number: string;
  connectionName?: string;
  carrierName?: string;
  sipTrunkHost?: string;
  accountSid?: string;
  authToken?: string;
  region?: string;
  businessKyc?: {
    authorizedSignatoryName?: string;
    businessRegistrationNumber?: string;
    address?: string;
  };
}

export interface PronunciationEntry {
  word: string;
  phonetic: string;
  notes?: string;
}

export interface ServiceKnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category: 'PRICING' | 'LEGAL_APPROVALS' | 'LOCATION' | 'AMENITIES' | 'FINANCING' | 'GENERAL';
}

export interface ServiceKnowledgeBaseData {
  serviceId: string;
  serviceName: string;
  category: string;
  knowledgeBase: ServiceKnowledgeItem[];
  pricingGuidelines?: string;
  disallowedTopics?: string;
  handOffTriggers?: string[];
}

export interface ConversationTurn {
  speaker: 'ai' | 'customer';
  text: string;
  timestampSeconds: number;
  interrupted?: boolean;
}

export interface SarvamToolExecution {
  toolName: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  timestamp: string;
}

export type TestScenarioType =
  | 'NATURAL_TAMIL'
  | 'TANGLISH'
  | 'ENGLISH'
  | 'BARGE_IN_INTERRUPTION'
  | 'CUSTOMER_SILENCE'
  | 'UNEXPECTED_QUESTION_OBJECTION'
  | 'HUMAN_HANDOFF';

export interface TestSimulationResult {
  scenario: TestScenarioType;
  title: string;
  description: string;
  language: string;
  voice: string;
  turns: ConversationTurn[];
  metrics: {
    averageLatencyMs: number;
    bargeInHandled: boolean;
    silenceNudgeTriggered: boolean;
    hallucinationRate: string;
    toolExecutions: SarvamToolExecution[];
    humanHandoffTriggered: boolean;
    qualityScore: number;
  };
  summary: string;
  extractedRequirements: Record<string, any>;
  durationSeconds: number;
  billableCostInr: number;
}

export interface TenantVoicePreference {
  id?: string;
  tenantId: string;
  preferredLanguage: string;
  secondaryLanguage?: string;
  preferredVoice: string;
  voiceGender?: string;
  speakingSpeed: number;
  conversationTone: string;
  greetingMessage: string;
  businessIntroduction: string;
  generalInstructions?: string;
  bargeInEnabled?: boolean;
  silenceThresholdMs?: number;
  responseDelayMs?: number;
  transparentAiDisclosure?: boolean;
  tanglishEnabled?: boolean;
  quietCallerNudgeEnabled?: boolean;
  quietCallerNudgePrompt?: string;
  humanHandoffEnabled?: boolean;
  humanHandoffNumber?: string;
  pronunciationDictionary?: PronunciationEntry[];
}

export interface SarvamVoice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  languages: string[];
  description: string;
  sampleUrl: string;
  recommendedUse: string;
  engine?: string;
}

export interface SarvamLanguage {
  code: string;
  name: string;
  nativeName: string;
  defaultVoice: string;
  supportsTanglish?: boolean;
}

export interface SarvamProviderHealth {
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  latencyMs: number;
  availableCredits: number;
  activeModel: string;
  lastCheckedAt: string;
  baseUrl?: string;
  error?: string;
}

export interface SarvamApiAuditLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  requestId: string;
  status: 'SUCCESS' | 'ERROR';
  tenantId?: string;
  leadId?: string;
  errorMessage?: string;
}

export interface AgentQualificationQuestion {
  id: string;
  question: string;
  purpose: string;
  expectedDataType: 'string' | 'number' | 'boolean' | 'choice';
  choices?: string[];
}

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
  provider: string;
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

export interface AgentOutputField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
}

export interface AgentConfiguration {
  id: string;
  tenantId: string;
  version: number;
  sourceProfileVersion: number;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'OUTDATED' | 'ARCHIVED';
  agentName: string;
  agentRole: string;
  organizationContext: string;
  channel: string;
  conversationObjectives: string[];
  openingGreeting: string;
  qualificationQuestions: AgentQualificationQuestion[];
  requiredInfo: string[];
  faqs: Array<{ question: string; answer: string; category: string }>;
  objectionHandling: Array<{ objection: string; response: string }>;
  speakingStyle: {
    maxWordsPerTurn?: number;
    pacing?: string;
    bargeInRule?: string;
    fillersAllowed?: string[];
    preserveTerms?: string[];
    language?: string;
    speaker?: string;
    model?: string;
  };
  followUpRules: string[];
  humanEscalationRules: string[];
  variables: Record<string, string>;
  outputFields: AgentOutputField[];
  prohibitedClaims: string[];
  missingInformation?: string[];
  fullPrompt: string;
  isOutdated: boolean;
  outdatedReason?: string | null;
  generatedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  history?: Array<{
    id: string;
    version: number;
    status: string;
    agentName: string;
    agentRole: string;
    generatedAt: string;
    approvedAt?: string | null;
    approvedBy?: string | null;
    isOutdated: boolean;
    outdatedReason?: string | null;
  }>;
}

