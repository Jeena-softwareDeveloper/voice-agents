export interface AgentQualificationQuestion {
  id: string;
  question: string;
  purpose: string;
  expectedDataType: 'string' | 'number' | 'boolean' | 'choice';
  choices?: string[];
}

export interface AgentFaqItem {
  question: string;
  answer: string;
  category: string;
}

export interface AgentObjectionHandling {
  objection: string;
  response: string;
}

export interface AgentOutputField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
}

export interface AgentConfigurationSchema {
  agentName: string;
  agentRole: string;
  organizationContext: string;
  channel: string;
  conversationObjectives: string[];
  openingGreeting: string;
  qualificationQuestions: AgentQualificationQuestion[];
  requiredInfo: string[];
  faqs: AgentFaqItem[];
  objectionHandling: AgentObjectionHandling[];
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
  missingInformation: string[];
  fullPrompt: string;
}
