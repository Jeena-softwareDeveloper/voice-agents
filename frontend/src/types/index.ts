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

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description: string;
  location?: string;
  pricingInfo?: string;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  serviceAiConfig?: ServiceAiConfig;
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
  contact: Contact;
  service: Service;
  calls?: Call[];
  followUps?: FollowUp[];
  tenant?: { id: string; name: string };
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
  title: string;
  description?: string;
  type: 'CALLBACK' | 'DEMO' | 'SITE_VISIT' | 'SALES_CALL' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  outcomeNotes?: string;
  contact: Contact;
  lead?: { service: { name: string } };
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
