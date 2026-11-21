export interface SarvamConversationConfig {
  companyName: string;
  serviceName: string;
  serviceDescription: string;
  openingIntro: string;
  qualificationQuestions: Array<{
    id: string;
    question: string;
    expectedAnswerType: 'yes_no' | 'budget' | 'timeline' | 'text' | 'choice';
    options?: string[];
  }>;
  approvedResponses: Record<string, string>;
  objectionHandling: Record<string, string>;
  closingStatement: string;
  language: string;
  voice: string;
  maxDurationSeconds: number;
}

export interface InitiateCallPayload {
  callId: string;
  tenantId: string;
  leadId: string;
  phoneNumber: string;
  customerName: string;
  config: SarvamConversationConfig;
}

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
    | 'FAILED';
  transcript: string;
  summary: string;
  objectionHandled?: string;
  callbackTime?: Date;
  qualificationResults: Record<string, any>;
  recordingUrl?: string;
}
