import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnectedToPostgres = false;
  private db: Record<string, any[]> = {};

  constructor() {
    super();
    this.initFallbackStore();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnectedToPostgres = true;
      this.logger.log('Successfully connected to PostgreSQL database.');
    } catch (err: any) {
      this.isConnectedToPostgres = false;
      this.logger.warn(
        'Primary PostgreSQL database is unreachable. Activating resilient in-memory multi-tenant store with complete seed data for interactive usage.',
      );
      this.setupModelProxies();
    }
  }

  async onModuleDestroy() {
    if (this.isConnectedToPostgres) {
      await this.$disconnect();
    }
  }

  private initFallbackStore() {
    const passwordHash = bcrypt.hashSync('Admin@123456', 10);
    const clientPasswordHash = bcrypt.hashSync('Client@123456', 10);

    const adminUser = {
      id: 'admin-user-001',
      email: 'admin@acrmplatform.com',
      passwordHash,
      fullName: 'Super Platform Admin',
      phone: '+919900011223',
      role: 'PLATFORM_ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const clientUser = {
      id: 'user-client-jj-001',
      email: 'client@jjrealestate.in',
      passwordHash: clientPasswordHash,
      fullName: 'Jayant Joshi',
      phone: '+919876500002',
      role: 'TENANT_ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenant1 = {
      id: 'tenant-jj-real-estate-001',
      name: 'JJ Real Estate Developers',
      slug: 'jj-real-estate',
      email: 'contact@jjrealestate.in',
      phone: '+919876500001',
      businessType: 'Real Estate & Infrastructure',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      status: 'ACTIVE',
      aiCallingEnabled: true,
      monthlyCallingLimit: 2000,
      usedCallingMinutes: 142.5,
      creditBalance: 450.0,
      dailyCallingLimit: 200,
      concurrencyLimit: 10,
      kycStatus: 'VERIFIED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenantMembership = {
      id: 'mem-001',
      tenantId: tenant1.id,
      userId: clientUser.id,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const businessProfile = {
      id: 'bp-001',
      tenantId: tenant1.id,
      businessName: 'JJ Real Estate Developers LLP',
      category: 'Real Estate Developer',
      description: 'Premier residential township and commercial development firm in western India.',
      website: 'https://jjrealestate.in',
      address: 'Pride Icon, Senapati Bapat Road, Pune',
      operatingLocations: 'Pune, Hinjawadi, Wagholi, Baner',
      primaryObjective: 'Automate first-line inbound lead calling and schedule on-site visits.',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const subscription = {
      id: 'sub-001',
      tenantId: tenant1.id,
      planName: 'Enterprise AI Calling Pro',
      status: 'ACTIVE',
      callingLimitMinutes: 2000,
      validityUntil: new Date(Date.now() + 300 * 24 * 3600 * 1000),
      initialCredits: 3000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const callingSettings = {
      id: 'cs-001',
      tenantId: tenant1.id,
      startHour: 10,
      endHour: 19,
      maxDailyCalls: 300,
      maxRetries: 3,
      retryIntervalMinutes: 180,
      timezone: 'Asia/Kolkata',
      isAutomatedCallingEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saasTemplate = {
      id: 'template-saas-cloud-v1',
      name: 'B2B Software & Cloud Services Qualification',
      description: 'Engages inbound B2B software leads, discovers technical requirements, and schedules product demonstrations.',
      industry: 'SaaS & Software Services',
      openingIntro: 'Hello! I am calling from {{companyName}} regarding your interest in {{serviceName}}. Do you have a brief moment to connect?',
      instructions: 'Discover team size, current technical stack, target timeline, and book an executive demonstration.',
      qualificationQuestions: [
        { id: 'q1', question: 'What is your current team size and target deployment timeline?', expectedAnswerType: 'choice', options: ['1-10 Users (Immediate)', '11-50 Users (1-3 Months)', '50+ Users (Enterprise)'] },
        { id: 'q2', question: 'Would you like to schedule a 20-minute tailored product walkthrough this week?', expectedAnswerType: 'yes_no' },
      ],
      approvedResponses: {
        'security': 'Our infrastructure complies with SOC2 Type II, ISO 27001, and Indian data residency standards.',
        'pricing': 'Subscription plans scale flexibly based on active users with annual discount commitments available.',
      },
      objectionHandling: {
        'migration': 'Our dedicated engineering solutions team provides complimentary data migration assistance and team onboarding.',
      },
      closingStatement: 'Thank you! We will dispatch the calendar confirmation and technical brief to your registered email.',
      defaultLanguage: 'en-IN',
      defaultVoice: 'default',
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const healthcareTemplate = {
      id: 'template-healthcare-v1',
      name: 'Healthcare Clinic & Patient Appointment Scheduling',
      description: 'Consults patient prospects, answers department and specialist queries, and reserves doctor consultations.',
      industry: 'Healthcare & Wellness',
      openingIntro: 'Namaste! I am calling from {{companyName}} regarding your inquiry for {{serviceName}}. How can our clinical team assist you?',
      instructions: 'Understand primary health consultation need, preferred appointment slot, and confirm clinic visit.',
      qualificationQuestions: [
        { id: 'q1', question: 'Which department or specialist consultation are you looking to schedule?', expectedAnswerType: 'text' },
        { id: 'q2', question: 'Do you prefer a morning or evening consultation slot?', expectedAnswerType: 'choice', options: ['Morning (9 AM - 1 PM)', 'Evening (4 PM - 8 PM)'] },
      ],
      approvedResponses: {
        'insurance': 'We accept all major cashless health insurance TPA networks and corporate medical policies.',
        'facilities': 'State-of-the-art diagnostic laboratories, NABH accredited patient suites, and 24x7 pharmacy available on site.',
      },
      objectionHandling: {
        'waiting_time': 'Priority digital appointments guarantee maximum 15-minute consultation turnaround.',
      },
      closingStatement: 'Thank you! Your appointment request has been recorded. Our care coordinator will send the booking token on WhatsApp.',
      defaultLanguage: 'hi-IN',
      defaultVoice: 'default',
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const realEstateTemplate = {
      id: 'template-realestate-v1',
      name: 'Property Advisory & Consultation Scheduling',
      description: 'Engages leads for property enquiries, answers project specifications and reserves advisory consultations.',
      industry: 'Real Estate & Infrastructure',
      openingIntro: 'Hello! I am calling from {{companyName}} regarding your recent inquiry for {{serviceName}}. Do you have a quick minute?',
      instructions: 'Confirm customer location, budget range, and invite for a personalized project consultation.',
      qualificationQuestions: [
        { id: 'q1', question: 'Are you planning this acquisition for self-use or investment?', expectedAnswerType: 'choice', options: ['Investment', 'Self-use'] },
        { id: 'q2', question: 'Would you like to schedule an introductory consultation with our senior project manager this weekend?', expectedAnswerType: 'yes_no' },
      ],
      approvedResponses: {
        'compliance': 'All offered projects possess accredited approvals with verified clear titles and legal certifications.',
        'amenities': 'Complete infrastructure including 24/7 security, paved roads, and verified utility connections.',
      },
      objectionHandling: {
        'pricing': 'Transparent standardized pricing with flexible milestone schedules and institutional bank loan assistance.',
      },
      closingStatement: 'Thank you! Our advisory team will dispatch the project overview and location details to your WhatsApp.',
      defaultLanguage: 'hi-IN',
      defaultVoice: 'default',
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const plotService = {
      id: 'service-plots-001',
      tenantId: tenant1.id,
      name: 'Residential Plots',
      category: 'Land & Plots',
      description: 'Gated community residential NA plots in Wagholi with clubhouse, wide roads and clear titles.',
      location: 'Wagholi, Pune',
      pricingInfo: 'Starting at 35 Lakhs for 1500 sq.ft.',
      additionalInfo: 'RERA approved with 80% bank loan sanction from SBI and HDFC.',
      approvalStatus: 'APPROVED',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const aptService = {
      id: 'service-apts-002',
      tenantId: tenant1.id,
      name: 'Luxury Apartments',
      category: 'Residential High-Rise',
      description: '2 & 3 BHK premium high-rise apartments in Baner with rooftop infinity pool and smart home automation.',
      location: 'Baner, Pune',
      pricingInfo: 'Starting at 85 Lakhs',
      additionalInfo: 'Ready for possession by Dec 2026.',
      approvalStatus: 'APPROVED',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const villaService = {
      id: 'service-villas-003',
      tenantId: tenant1.id,
      name: 'Villa Sales',
      category: 'Independent Villas',
      description: 'Custom-designed 4 BHK luxury villas with private gardens.',
      location: 'Hinjawadi Phase 3',
      pricingInfo: 'Starting at 1.8 Cr',
      additionalInfo: 'Ultra-exclusive 20 units.',
      approvalStatus: 'PENDING_APPROVAL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const serviceAiConfig = {
      id: 'ai-cfg-001',
      tenantId: tenant1.id,
      serviceId: plotService.id,
      templateId: realEstateTemplate.id,
      companyIdentity: 'JJ Real Estate',
      serviceDescription: 'Hamare residential plots Coimbatore Saravanampatti aur Pune Wagholi mein hain, jo ki clear title, DTCP aur PMRDA approved hain.',
      openingIntro: 'Vanakkam! Main JJ Real Estate se Maya pesuren. Neenga residential plots pathi ketrundheenga. Is this a good time to speak?',
      instructions: 'Confirm customer location, budget range, and invite for this weekend site visit. Answer strictly from knowledge base without inventing pricing.',
      qualificationQuestions: realEstateTemplate.qualificationQuestions,
      approvedResponses: realEstateTemplate.approvedResponses,
      objectionHandling: realEstateTemplate.objectionHandling,
      language: 'ta-IN',
      voice: 'default',
      maxDurationSeconds: 300,
      closingStatement: 'Nandri! Hamare sales manager aapko location map WhatsApp kar rahe hain.',
      status: 'APPROVED',
      version: 1,
      knowledgeBase: [
        {
          id: 'kb-01',
          category: 'LEGAL_APPROVALS',
          question: 'What legal approvals do your Coimbatore and Pune plots possess?',
          answer: 'All Coimbatore Saravanampatti plots hold DTCP Approval (DTCP/CBE/2024/892) & TN RERA. Pune Wagholi plots hold clear PMRDA and MahaRERA sanctions with 100% legal title searches.',
        },
        {
          id: 'kb-02',
          category: 'FINANCING',
          question: 'Are bank loans available?',
          answer: 'Yes, pre-approved bank loans up to 80% of property cost available through SBI, HDFC, and ICICI Bank with fast 5-day approvals.',
        },
        {
          id: 'kb-03',
          category: 'PRICING',
          question: 'What is the starting price?',
          answer: 'Residential plots start at ₹30 Lakhs for 1500 sq.ft in Saravanampatti Coimbatore, and ₹35 Lakhs in Wagholi Pune. Transparent pricing with no hidden charges.',
        },
      ],
      pricingGuidelines: 'Transparent fixed rates from ₹2,200/sq.ft. Early-bird registration fee waiver.',
      disallowedTopics: 'Never promise unapproved discounts, unauthorized possession dates, or speculative returns.',
      handOffTriggers: ['manager', 'human', 'complaint', 'legal dispute', 'NRI power of attorney', 'bulk purchase'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const aptAiConfig = {
      id: 'ai-cfg-002',
      tenantId: tenant1.id,
      serviceId: aptService.id,
      templateId: realEstateTemplate.id,
      companyIdentity: 'JJ Real Estate Developers',
      serviceDescription: 'Baner & Hinjawadi premium 2 & 3 BHK high-rise residences with clubhouse, rooftop pool, and 85% open landscaped greens.',
      openingIntro: 'Good day! I am calling from JJ Real Estate regarding your enquiry for our Luxury Apartments in Baner. Do you have a quick minute?',
      instructions: 'Understand 2 BHK vs 3 BHK preference, floor choice, and schedule family sample flat visit.',
      qualificationQuestions: realEstateTemplate.qualificationQuestions,
      approvedResponses: realEstateTemplate.approvedResponses,
      objectionHandling: realEstateTemplate.objectionHandling,
      language: 'en-IN',
      voice: 'default',
      maxDurationSeconds: 300,
      closingStatement: 'Thank you! We look forward to hosting your family at our Baner experience lounge.',
      status: 'APPROVED',
      version: 1,
      knowledgeBase: [
        {
          id: 'kb-apt-01',
          category: 'PRICING',
          question: 'What is the price for 2 BHK and 3 BHK?',
          answer: '2 BHK starting at ₹85 Lakhs (1050 sq.ft) and 3 BHK starting at ₹1.35 Crores (1550 sq.ft) all-inclusive.',
        },
        {
          id: 'kb-apt-02',
          category: 'LEGAL_APPROVALS',
          question: 'Is the project MahaRERA approved?',
          answer: 'Yes, MahaRERA Registration No. P52100045812. Ready for possession by Dec 2026.',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contact1 = {
      id: 'contact-001',
      tenantId: tenant1.id,
      fullName: 'Arun Kulkarni',
      phone: '+919822011223',
      email: 'arun.kulkarni@gmail.com',
      location: 'Kothrud, Pune',
      notes: 'Interested in corner plot for villa construction.',
      consentGranted: true,
      consentDate: new Date(),
      consentSource: 'Website Landing Page Enquiry',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contact2 = {
      id: 'contact-002',
      tenantId: tenant1.id,
      fullName: 'Priya Sharma',
      phone: '+919822044556',
      email: 'priya.sharma@outlook.com',
      location: 'Viman Nagar, Pune',
      notes: 'Looking for 3BHK flat near IT park.',
      consentGranted: true,
      consentDate: new Date(),
      consentSource: 'Excel Lead Import',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contact3 = {
      id: 'contact-karthik-003',
      tenantId: tenant1.id,
      fullName: 'Karthik Subramanian',
      phone: '+919840123456',
      email: 'karthik.subramanian@gmail.com',
      location: 'Saravanampatti, Coimbatore',
      notes: 'Looking for 2400 sq.ft DTCP plot near CHIL SEZ IT Corridor, budget 30-35 Lakhs.',
      consentGranted: true,
      consentDate: new Date(),
      consentSource: 'Tamil Housing Expo 2026',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const lead1 = {
      id: 'lead-arun-plots-01',
      tenantId: tenant1.id,
      contactId: contact1.id,
      serviceId: plotService.id,
      leadSource: 'Google Ads Campaign',
      status: 'QUALIFIED',
      interestLevel: 'HIGH',
      aiCallingEligible: true,
      callAttempts: 1,
      lastCallDate: new Date(Date.now() - 3600 * 1000 * 24),
      nextFollowUpDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      qualificationNotes: 'Customer confirmed ₹40L budget. Interested in corner plot. Site visit booked for Saturday.',
      createdAt: new Date(Date.now() - 3600 * 1000 * 48),
      updatedAt: new Date(),
    };

    const lead2 = {
      id: 'lead-priya-apt-02',
      tenantId: tenant1.id,
      contactId: contact2.id,
      serviceId: aptService.id,
      leadSource: 'Property Portal',
      status: 'NEW_LEAD',
      interestLevel: 'MEDIUM',
      aiCallingEligible: true,
      callAttempts: 0,
      lastCallDate: null,
      nextFollowUpDate: null,
      qualificationNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const lead3 = {
      id: 'lead-karthik-plots-03',
      tenantId: tenant1.id,
      contactId: contact3.id,
      serviceId: plotService.id,
      leadSource: 'Tamil Housing Expo 2026',
      status: 'NEW_LEAD',
      interestLevel: 'HIGH',
      aiCallingEligible: true,
      callAttempts: 0,
      lastCallDate: null,
      nextFollowUpDate: null,
      qualificationNotes: 'Enquired about Saravanampatti 2400 sq.ft plot. Budget ₹30-35 Lakhs.',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const call1 = {
      id: 'call-arun-plots-01',
      tenantId: tenant1.id,
      leadId: lead1.id,
      serviceId: plotService.id,
      serviceAiConfigId: serviceAiConfig.id,
      externalCallId: 'srv_call_9822011223_01',
      callerNumber: '+919810012345',
      recipientNumber: contact1.phone,
      status: 'COMPLETED',
      outcome: 'QUALIFIED',
      durationSeconds: 145,
      billableSeconds: 145,
      recordingUrl: 'https://recordings.acrm-storage.com/srv_call_9822011223_01.mp3',
      transcript: '[AI Voice Agent]: Namaste! Main JJ Real Estate se baat kar rahi hoon. Aapne Wagholi plots ke baare mein enquire kiya tha.\n[Arun]: Haan ji, plot sizes kya hain?\n[AI]: 1500 se 2500 sq.ft ke plots hain clear title ke saath.\n[Arun]: Theek hai, main Shanivar 11 baje visit kar sakta hoon.',
      summary: 'Customer verified interest in 1500 sqft residential plot. Confirmed Saturday 11 AM site visit.',
      objectionHandled: 'Infrastructure & metro connectivity explained',
      nextAction: 'Host on-site visit',
      costAmount: 3.65,
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
      updatedAt: new Date(),
    };

    const aiUsage = {
      id: 'usage-001',
      tenantId: tenant1.id,
      callId: call1.id,
      billableMinutes: 2.42,
      providerCost: 2.3,
      billedToClient: 3.65,
      ratePerMinute: 1.5,
      currency: 'INR',
      idempotencyKey: `usage_${call1.id}_01`,
      createdAt: new Date(),
    };

    const followUp1 = {
      id: 'followup-arun-sitevisit',
      tenantId: tenant1.id,
      contactId: contact1.id,
      leadId: lead1.id,
      title: 'Saturday Site Visit - Arun Kulkarni',
      description: 'Host Arun Kulkarni at Wagholi site office at 11:00 AM for plot layout review.',
      type: 'SITE_VISIT',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      status: 'PENDING',
      outcomeNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const invoice1 = {
      id: 'inv-001',
      tenantId: tenant1.id,
      invoiceNumber: 'INV-202611-JJ01',
      billingPeriodStart: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      billingPeriodEnd: new Date(),
      callingMinutes: 142.5,
      callingCharges: 213.75,
      subscriptionCharges: 2999.0,
      taxAmount: 578.3,
      totalAmount: 3791.05,
      amountPaid: 3791.05,
      status: 'PAID',
      dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      paidAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const voicePref1 = {
      id: 'voice-pref-jj-001',
      tenantId: tenant1.id,
      preferredLanguage: 'ta-IN',
      secondaryLanguage: 'en-IN',
      preferredVoice: 'default',
      voiceGender: 'female',
      speakingSpeed: 1.0,
      conversationTone: 'CONSULTATIVE',
      greetingMessage: 'Vanakkam! I am Maya, an AI assistant from JJ Real Estate. You had enquired about our services. Is this a good time to speak?',
      businessIntroduction: 'JJ Real Estate Developers provides premier residential and commercial development solutions across key metropolitan regions.',
      generalInstructions: 'Qualify customer requirements, answer queries based on the verified knowledge base, and schedule an introductory consultation.',
      bargeInEnabled: true,
      silenceThresholdMs: 800,
      responseDelayMs: 600,
      transparentAiDisclosure: true,
      tanglishEnabled: true,
      quietCallerNudgeEnabled: true,
      quietCallerNudgePrompt: 'Are you still with me? Please take your time.',
      humanHandoffEnabled: true,
      humanHandoffNumber: '+91 98401 99881',
      pronunciationDictionary: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const creditTx1 = {
      id: 'tx-001',
      tenantId: tenant1.id,
      type: 'CREDIT_PURCHASE',
      amount: 500.0,
      balanceAfter: 500.0,
      description: 'Initial Plan Allocation - Enterprise AI Pro',
      createdAt: new Date(Date.now() - 3600 * 1000 * 48),
    };

    const creditTx2 = {
      id: 'tx-002',
      tenantId: tenant1.id,
      type: 'USAGE_DEDUCTION',
      amount: -50.0,
      balanceAfter: 450.0,
      description: 'AI Calling Usage (Batch dispatch)',
      referenceId: 'call-arun-plots-01',
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
    };

    const settings = [
      { id: '1', key: 'sarvam_api_key', value: 'srv_live_default_key_2026', category: 'AI_PROVIDER', updatedAt: new Date() },
      { id: '3', key: 'ai_minute_rate', value: '1.50', category: 'PRICING', updatedAt: new Date() },
      { id: '4', key: 'telephony_minute_rate', value: '0.40', category: 'PRICING', updatedAt: new Date() },
      { id: '5', key: 'calling_start_hour', value: '9', category: 'CALLING_RULES', updatedAt: new Date() },
      { id: '6', key: 'calling_end_hour', value: '20', category: 'CALLING_RULES', updatedAt: new Date() },
      { id: '7', key: 'concurrency_limit', value: '50', category: 'CALLING_RULES', updatedAt: new Date() },
      { id: '8', key: 'default_language', value: 'hi-IN', category: 'CALLING_RULES', updatedAt: new Date() },
    ];

    const sarvamAgentConfig1 = {
      id: 'sac-001',
      tenantId: tenant1.id,
      serviceId: plotService.id,
      sarvamOrgId: 'org_acrm_enterprise',
      sarvamWorkspaceId: 'default',
      sarvamAppId: 'app_residential_plots_voice',
      committedVersion: 3,
      status: 'CONFIGURED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sarvamAgentConfig2 = {
      id: 'sac-002',
      tenantId: tenant1.id,
      serviceId: aptService.id,
      sarvamOrgId: 'org_acrm_enterprise',
      sarvamWorkspaceId: 'default',
      sarvamAppId: 'app_luxury_apts_voice',
      committedVersion: 2,
      status: 'CONFIGURED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenant1AgentConfig = {
      id: 'cfg-jj-real-estate-001',
      tenantId: tenant1.id,
      version: 1,
      sourceProfileVersion: 1,
      status: 'APPROVED',
      agentName: 'Maya',
      agentRole: 'Senior Property Consultant',
      organizationContext: `${tenant1.name} is a premier residential township and commercial development firm in western India, operating across Pune, Hinjawadi, Wagholi, and Baner.`,
      channel: 'Outbound phone call over telephony',
      conversationObjectives: [
        'Acknowledge and thank customer for their recent inquiry regarding Pune property offerings.',
        'Qualify requirements: 2/3 BHK luxury apartment vs residential villa plot preference, budget range, and timeline.',
        'Answer questions regarding RERA approval, location advantages, and bank loan approvals strictly from verified offerings.',
        'Schedule a family weekend site visit or experience lounge walkthrough.',
      ],
      openingGreeting: `Namaste! I am Maya calling from ${tenant1.name}. I am following up on your recent property enquiry with us. Do you have two minutes to speak?`,
      qualificationQuestions: [
        {
          id: 'q_unit_type',
          question: 'Are you exploring luxury apartments in Baner or residential villa plots in Wagholi?',
          purpose: 'Determine product line interest',
          expectedDataType: 'choice',
          choices: ['Luxury Apartments (Baner)', 'Residential Plots (Wagholi)', 'Villa Sales (Hinjawadi)'],
        },
        {
          id: 'q_budget',
          question: 'What is your comfortable investment budget range for this property purchase?',
          purpose: 'Qualify purchasing power with verified price catalog',
          expectedDataType: 'string',
        },
        {
          id: 'q_timeline',
          question: 'How soon are you planning to finalize and take possession?',
          purpose: 'Assess buyer urgency and sales stage',
          expectedDataType: 'string',
        },
      ],
      requiredInfo: ['preferredLocation', 'budgetRange', 'possessionTimeline', 'siteVisitDate'],
      faqs: [
        {
          question: 'What are the starting prices for your offerings?',
          answer: 'Residential plots start at 35 Lakhs for 1500 sq.ft in Wagholi, Baner Luxury Apartments start at 85 Lakhs, and custom villas in Hinjawadi start at 1.8 Cr.',
          category: 'PRICING',
        },
        {
          question: 'Are all properties RERA approved and eligible for bank loans?',
          answer: 'Yes, all projects carry clear-title MahaRERA and PMRDA sanctions with pre-approved 80% financing from SBI, HDFC, and ICICI.',
          category: 'LEGAL_AND_FINANCING',
        },
      ],
      objectionHandling: [
        {
          objection: 'The price feels high compared to other areas.',
          response: 'Our projects include 85% open landscaped greens, clubhouse, rooftop pool, and prime connectivity to Hinjawadi IT Park. Would you like to inspect the sample flat to evaluate the construction quality?',
        },
        {
          objection: 'I am just browsing right now, please share details on WhatsApp.',
          response: 'Certainly! I will send our digital brochure and location map to your WhatsApp right away. Can I confirm if you prefer Baner or Wagholi?',
        },
      ],
      speakingStyle: {
        language: 'ta-IN',
        speaker: 'kavya',
        model: 'bulbul:v3',
        maxWordsPerTurn: 25,
        pacing: 'Calm, consultative, unhurried',
        bargeInRule: 'Immediate halt when customer interrupts',
        fillersAllowed: ['haan', 'bilkul', 'certainly', 'understood'],
        preserveTerms: ['RERA', 'PMRDA', '2 BHK', '3 BHK', 'sq.ft', 'Crore', 'Lakhs'],
      },
      followUpRules: [
        'Schedule weekend site visit if lead confirms budget and timeline within 3 months.',
        'Send WhatsApp brochure if customer requests digital documentation.',
      ],
      humanEscalationRules: [
        'Commercial bulk purchase or NRI power of attorney inquiries.',
        'Specific legal contract clauses or customized payment schedules.',
        'Customer express request to speak with Senior Sales Manager.',
      ],
      variables: {
        customerName: 'Prospect',
        serviceEnquiry: 'Luxury Apartments & Plots',
        preferredLocation: 'Baner / Wagholi, Pune',
        budgetRange: '₹35 Lakhs - ₹1.8 Cr',
      },
      outputFields: [
        { key: 'propertyCategory', label: 'Preferred Category', type: 'string', description: 'Apartment, Plot, or Villa' },
        { key: 'budgetVerified', label: 'Budget Verified', type: 'boolean', description: 'Confirmed within offering range' },
        { key: 'timeline', label: 'Target Finalization', type: 'string', description: 'Immediate, 1-3 months, 6+ months' },
        { key: 'siteVisitScheduled', label: 'Site Visit Scheduled', type: 'boolean', description: 'Agreed for on-site inspection' },
      ],
      prohibitedClaims: [
        'Never guarantee speculative land appreciation percentages.',
        'Never promise unapproved cash discounts or unauthorized early possession.',
        'Never quote non-RERA registered phases.',
      ],
      missingInformation: [],
      fullPrompt: `Role: You are Maya, a senior property consultant at JJ Real Estate Developers. Channel: Outbound voice call over telephony. Objective: Qualify prospective homebuyers for luxury apartments and residential plots in Pune. Keep replies under 25 words per turn.`,
      isOutdated: false,
      outdatedReason: null,
      generatedAt: new Date(Date.now() - 3600 * 1000 * 24),
      approvedAt: new Date(Date.now() - 3600 * 1000 * 12),
      approvedBy: 'Administrator',
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 12),
    };

    const tenant2 = {
      id: 'tenant-cloudscale-it-002',
      name: 'CloudScale Technologies',
      slug: 'cloudscale-tech',
      email: 'contact@cloudscale.io',
      phone: '+91 80 4911 2233',
      businessType: 'Enterprise Cloud Architecture & Cybersecurity',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      status: 'ACTIVE',
      aiCallingEnabled: true,
      monthlyCallingLimit: 2000,
      usedCallingMinutes: 45.0,
      creditBalance: 600.0,
      dailyCallingLimit: 200,
      concurrencyLimit: 10,
      kycStatus: 'VERIFIED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client2User = {
      id: 'user-client-002',
      email: 'client@cloudscale.io',
      passwordHash: clientPasswordHash,
      fullName: 'Vikram Mehta',
      role: 'TENANT_ADMIN',
      tenantId: tenant2.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenantMembership2 = {
      id: 'mem-002',
      tenantId: tenant2.id,
      userId: client2User.id,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const businessProfile2 = {
      id: 'bp-002',
      tenantId: tenant2.id,
      businessName: 'CloudScale Technologies Pvt Ltd',
      category: 'Cloud Infrastructure & DevSecOps',
      description: 'Enterprise AWS/GCP cloud migration, infrastructure audits, and Kubernetes cost optimization consultancy.',
      website: 'https://cloudscale.io',
      address: 'Prestige Tech Park, Outer Ring Road, Bangalore',
      operatingLocations: 'Bangalore, Hyderabad, Global Remote',
      primaryObjective: 'Qualify enterprise CTOs and Engineering VPs for cloud architecture audits.',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const itService1 = {
      id: 'srv-cloud-audit-01',
      tenantId: tenant2.id,
      name: 'Cloud Architecture & Security Audit',
      category: 'Cloud Computing & CyberSecurity',
      description: 'Comprehensive 40-point architectural well-architected review covering security compliance, IAM least privilege, and cost waste elimination.',
      location: 'Global Remote & Hybrid',
      pricingInfo: '75,000 INR per Infrastructure audit',
      additionalInfo: 'Delivers executive security scorecard, remediation roadmap, and guaranteed 20%+ cloud waste reduction within 14 days.',
      approvalStatus: 'APPROVED',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenant2AgentConfig = {
      id: 'cfg-cloudscale-002',
      tenantId: tenant2.id,
      version: 1,
      sourceProfileVersion: 1,
      status: 'APPROVED',
      agentName: 'Alex',
      agentRole: 'Cloud Solutions Specialist',
      organizationContext: `CloudScale Technologies is an enterprise cloud architecture and DevSecOps consultancy based in Prestige Tech Park, Bangalore.`,
      channel: 'Outbound phone call over telephony',
      conversationObjectives: [
        'Introduce CloudScale Technologies following customer download of Cloud Security Whitepaper.',
        'Qualify cloud environment: Primary cloud provider (AWS/Azure/GCP), monthly spend, and upcoming migration initiatives.',
        'Propose an initial 40-point architecture and cost audit at ₹75,000.',
        'Schedule a 30-minute discovery call with our Lead Principal Architect.',
      ],
      openingGreeting: 'Hello! I am Alex calling from CloudScale Technologies. I noticed your interest in our Cloud Security & Cost Optimization framework. Do you have a brief moment to connect?',
      qualificationQuestions: [
        {
          id: 'q_primary_cloud',
          question: 'What is your primary cloud environment currently—AWS, Google Cloud, or Microsoft Azure?',
          purpose: 'Identify infrastructure stack',
          expectedDataType: 'choice',
          choices: ['AWS', 'Google Cloud', 'Microsoft Azure', 'Multi-Cloud / Hybrid'],
        },
        {
          id: 'q_monthly_spend',
          question: 'What scale of monthly cloud spend is your engineering team currently managing?',
          purpose: 'Evaluate audit return on investment',
          expectedDataType: 'string',
        },
      ],
      requiredInfo: ['primaryCloud', 'cloudSpendScale', 'complianceNeeds', 'discoveryCallTime'],
      faqs: [
        {
          question: 'How long does the Cloud Architecture & Security Audit take?',
          answer: 'The comprehensive audit takes approximately 5 business days, after which we deliver the full security remediation scorecard and cost savings report.',
          category: 'TIMELINE',
        },
        {
          question: 'What is the cost of the audit?',
          answer: 'The full 40-point infrastructure review is fixed at 75,000 INR, backed by our guaranteed 20%+ cloud waste identification.',
          category: 'PRICING',
        },
      ],
      objectionHandling: [
        {
          objection: 'Our internal DevOps team already manages our cloud.',
          response: 'Our audit focuses on third-party security compliance, SOC2/ISO readiness, and uncovering unused egress bandwidth that internal teams typically overlook. Would you like a redacted sample report?',
        },
      ],
      speakingStyle: {
        language: 'en-IN',
        speaker: 'rohan',
        model: 'bulbul:v3',
        maxWordsPerTurn: 22,
        pacing: 'Direct, technical, professional',
        bargeInRule: 'Immediate pause when customer speaks',
        fillersAllowed: ['certainly', 'understood', 'makes sense'],
        preserveTerms: ['AWS', 'GCP', 'Azure', 'Kubernetes', 'DevSecOps', 'IAM', 'SOC2', 'HIPAA'],
      },
      followUpRules: [
        'Schedule discovery call with Principal Cloud Architect if lead expresses interest.',
      ],
      humanEscalationRules: [
        'Active security breach or urgent cloud outage.',
        'Enterprise procurement contracts over 10 Lakhs.',
      ],
      variables: {
        customerName: 'Engineering Leader',
        companySize: '50-200 Engineers',
        cloudProvider: 'AWS / GCP',
        auditFocus: 'Cost Waste & SOC2 Compliance',
      },
      outputFields: [
        { key: 'cloudPlatform', label: 'Cloud Platform', type: 'string', description: 'AWS, GCP, Azure' },
        { key: 'costAuditQualified', label: 'Audit Qualified', type: 'boolean', description: 'Meets spend criteria' },
        { key: 'meetingRequested', label: 'Discovery Call Agreed', type: 'boolean', description: 'Agreed for technical review' },
      ],
      prohibitedClaims: [
        'Never guarantee zero-downtime without reviewing existing architecture.',
        'Never disclose proprietary client architectures without NDA.',
      ],
      missingInformation: [],
      fullPrompt: `Role: You are Alex, Cloud Solutions Specialist at CloudScale Technologies. Channel: Outbound phone call over telephony. Objective: Qualify engineering leaders for 40-point cloud architecture audits. Keep turns under 22 words.`,
      isOutdated: false,
      outdatedReason: null,
      generatedAt: new Date(),
      approvedAt: new Date(),
      approvedBy: 'Administrator',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenant3 = {
      id: 'tenant-eduspark-edu-003',
      name: 'EduSpark Academy',
      slug: 'eduspark-academy',
      email: 'admissions@eduspark.edu.in',
      phone: '+91 44 2855 4321',
      businessType: 'Higher Education & Professional Upskilling',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      status: 'ACTIVE',
      aiCallingEnabled: true,
      monthlyCallingLimit: 2000,
      usedCallingMinutes: 12.0,
      creditBalance: 500.0,
      dailyCallingLimit: 200,
      concurrencyLimit: 10,
      kycStatus: 'VERIFIED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client3User = {
      id: 'user-client-003',
      email: 'admissions@eduspark.edu.in',
      passwordHash: clientPasswordHash,
      fullName: 'Dr. Radhika Iyer',
      role: 'TENANT_ADMIN',
      tenantId: tenant3.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tenantMembership3 = {
      id: 'mem-003',
      tenantId: tenant3.id,
      userId: client3User.id,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const businessProfile3 = {
      id: 'bp-003',
      tenantId: tenant3.id,
      businessName: 'EduSpark Academy of Advanced Computing',
      category: 'Higher Education & Executive Certifications',
      description: 'Premier executive education institute providing accredited postgraduate diplomas in Artificial Intelligence, Data Science, and Full Stack Cloud Architecture.',
      website: 'https://eduspark.edu.in',
      address: 'Anna Salai, Guindy, Chennai',
      operatingLocations: 'Chennai, Coimbatore, Online Cohorts',
      primaryObjective: 'Counsel prospective students, qualify prerequisite work experience, and enroll in upcoming AI Diploma cohort.',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const eduService1 = {
      id: 'srv-ai-diploma-01',
      tenantId: tenant3.id,
      name: 'Postgraduate Executive Diploma in Generative AI',
      category: 'Executive Education',
      description: '11-month weekend executive certification covering LLM fine-tuning, RAG architecture, Agentic workflows, and production deployment with university accreditation.',
      location: 'Chennai Campus & Live Interactive Virtual Classrooms',
      pricingInfo: '1,25,000 INR with flexible 0% interest EMI options',
      additionalInfo: 'Eligibility: 1+ years programming experience or STEM degree. 92% career placement assistance.',
      approvalStatus: 'APPROVED',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db = {
      user: [adminUser, clientUser, client2User, client3User],
      tenant: [tenant1, tenant2, tenant3],
      tenantMembership: [tenantMembership, tenantMembership2, tenantMembership3],
      tenantInvitation: [],
      tenantBusinessProfile: [businessProfile, businessProfile2, businessProfile3],
      subscription: [subscription],
      tenantCallingSetting: [callingSettings],
      tenantVoicePreference: [voicePref1],
      creditTransaction: [creditTx1, creditTx2],
      aiConversationTemplate: [realEstateTemplate],
      service: [plotService, aptService, villaService, itService1, eduService1],
      serviceAiConfig: [serviceAiConfig, aptAiConfig],
      sarvamAgentConfig: [sarvamAgentConfig1, sarvamAgentConfig2],
      sarvamVoiceSession: [],
      tenantAgentConfiguration: [tenant1AgentConfig, tenant2AgentConfig],
      agentConfigurationVersion: [],
      contact: [contact1, contact2, contact3],
      lead: [lead1, lead2, lead3],
      call: [call1],
      callEvent: [],
      aiUsageLedger: [aiUsage],
      followUp: [followUp1],
      salesPipelineHistory: [],
      customer: [],
      invoice: [invoice1],
      payment: [],
      globalSetting: settings,
      leadImportBatch: [],
      leadImportRow: [],
    };
  }

  private setupModelProxies() {
    const models = Object.keys(this.db);

    models.forEach((modelName) => {
      const collection = this.db[modelName];

      const mockModel = {
        findMany: async (args: any = {}) => {
          let list = [...collection];
          if (args.where) {
            list = list.filter((item) => this.matchesWhere(item, args.where));
          }
          if (args.orderBy) {
            list = this.sortList(list, args.orderBy);
          }
          if (args.take) {
            list = list.slice(0, args.take);
          }
          return list.map((item) => this.hydrateRelations(modelName, item, args.include));
        },

        findFirst: async (args: any = {}) => {
          let list = [...collection];
          if (args.where) {
            list = list.filter((item) => this.matchesWhere(item, args.where));
          }
          const item = list[0] || null;
          return item ? this.hydrateRelations(modelName, item, args.include) : null;
        },

        findUnique: async (args: any = {}) => {
          const item = collection.find((i) => this.matchesWhere(i, args.where)) || null;
          return item ? this.hydrateRelations(modelName, item, args.include) : null;
        },

        create: async (args: any) => {
          const record = {
            id: args.data.id || uuidv4(),
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          collection.push(record);
          return this.hydrateRelations(modelName, record, args.include);
        },

        update: async (args: any) => {
          const idx = collection.findIndex((i) => this.matchesWhere(i, args.where));
          if (idx !== -1) {
            const current = collection[idx];
            const updated = {
              ...current,
              ...args.data,
              updatedAt: new Date(),
            };
            if (args.data.usedCallingMinutes?.increment) {
              updated.usedCallingMinutes = Number(current.usedCallingMinutes || 0) + args.data.usedCallingMinutes.increment;
            }
            if (args.data.callAttempts?.increment) {
              updated.callAttempts = (current.callAttempts || 0) + args.data.callAttempts.increment;
            }
            if (args.data.creditBalance?.increment) {
              updated.creditBalance = Number(current.creditBalance || 0) + args.data.creditBalance.increment;
            }
            if (args.data.creditBalance?.decrement) {
              updated.creditBalance = Math.max(0, Number(current.creditBalance || 0) - args.data.creditBalance.decrement);
            }
            collection[idx] = updated;
            return this.hydrateRelations(modelName, updated, args.include);
          }
          return null;
        },

        upsert: async (args: any) => {
          const existing = collection.find((i) => this.matchesWhere(i, args.where));
          if (existing) {
            return mockModel.update({ where: args.where, data: args.update, include: args.include });
          } else {
            return mockModel.create({ data: args.create, include: args.include });
          }
        },

        updateMany: async (args: any = {}) => {
          let count = 0;
          for (let i = 0; i < collection.length; i++) {
            if (this.matchesWhere(collection[i], args.where)) {
              collection[i] = {
                ...collection[i],
                ...args.data,
                updatedAt: new Date(),
              };
              count++;
            }
          }
          return { count };
        },

        delete: async (args: any) => {
          const idx = collection.findIndex((i) => this.matchesWhere(i, args.where));
          if (idx !== -1) {
            const [deleted] = collection.splice(idx, 1);
            return deleted;
          }
          return null;
        },

        deleteMany: async (args: any = {}) => {
          let count = 0;
          for (let i = collection.length - 1; i >= 0; i--) {
            if (this.matchesWhere(collection[i], args.where)) {
              collection.splice(i, 1);
              count++;
            }
          }
          return { count };
        },

        count: async (args: any = {}) => {
          let list = [...collection];
          if (args.where) {
            list = list.filter((item) => this.matchesWhere(item, args.where));
          }
          return list.length;
        },

        aggregate: async (args: any = {}) => {
          let list = [...collection];
          if (args.where) {
            list = list.filter((item) => this.matchesWhere(item, args.where));
          }
          const sum: Record<string, number> = {};
          if (args._sum) {
            Object.keys(args._sum).forEach((field) => {
              sum[field] = list.reduce((acc, i) => acc + (Number(i[field]) || 0), 0);
            });
          }
          return { _sum: sum };
        },
      };

      (this as any)[modelName] = mockModel;
    });

    (this as any).$transaction = async (input: any) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }
      if (typeof input === 'function') {
        return input(this);
      }
      return input;
    };
  }

  private matchesWhere(item: any, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      const val = where[key];
      if (key === 'OR' && Array.isArray(val)) {
        const matchesOr = val.some((clause) => this.matchesWhere(item, clause));
        if (!matchesOr) return false;
        continue;
      }
      if (key === 'tenantId_phone') {
        if (item.tenantId !== val.tenantId || item.phone !== val.phone) return false;
        continue;
      }
      if (key === 'tenantId_name') {
        if (item.tenantId !== val.tenantId || item.name !== val.name) return false;
        continue;
      }
      if (key === 'tenantId_userId') {
        if (item.tenantId !== val.tenantId || item.userId !== val.userId) return false;
        continue;
      }
      if (key === 'tenantId_contactId') {
        if (item.tenantId !== val.tenantId || item.contactId !== val.contactId) return false;
        continue;
      }
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        if (val.in && Array.isArray(val.in)) {
          if (!val.in.includes(item[key])) return false;
          continue;
        }
        if (val.not !== undefined) {
          if (item[key] === val.not) return false;
          continue;
        }
        if (val.contains) {
          if (!item[key] || !String(item[key]).toLowerCase().includes(String(val.contains).toLowerCase())) return false;
          continue;
        }
        if (val.equals !== undefined) {
          if (String(item[key]).toLowerCase() !== String(val.equals).toLowerCase()) return false;
          continue;
        }
        if (val.gte !== undefined && item[key] < val.gte) return false;
        if (val.lte !== undefined && item[key] > val.lte) return false;
        if (val.gt !== undefined && item[key] <= val.gt) return false;
        if (val.lt !== undefined && item[key] >= val.lt) return false;
      } else if (item[key] !== val) {
        return false;
      }
    }
    return true;
  }

  private sortList(list: any[], orderBy: any) {
    const key = Object.keys(orderBy)[0];
    const dir = orderBy[key];
    return list.sort((a, b) => {
      if (dir === 'desc') return (b[key] > a[key] ? 1 : -1);
      return (a[key] > b[key] ? 1 : -1);
    });
  }

  private hydrateRelations(modelName: string, item: any, include: any): any {
    if (!include || !item) return item;
    const res = { ...item };

    if (include.contact && item.contactId) {
      res.contact = this.db.contact.find((c) => c.id === item.contactId);
    }
    if (include.lead && item.leadId) {
      const l = this.db.lead.find((lead) => lead.id === item.leadId);
      if (l && include.lead.include?.contact && l.contactId) {
        l.contact = this.db.contact.find((c) => c.id === l.contactId);
      }
      res.lead = l;
    }
    if (include.service && item.serviceId) {
      const s = this.db.service.find((s) => s.id === item.serviceId);
      if (s && include.service.include?.serviceAiConfig) {
        s.serviceAiConfig = this.db.serviceAiConfig.find((c) => c.serviceId === s.id);
      }
      res.service = s;
    }
    if (include.tenant && item.tenantId) {
      res.tenant = this.db.tenant.find((t) => t.id === item.tenantId);
    }
    if (include.serviceAiConfig && modelName === 'service') {
      res.serviceAiConfig = this.db.serviceAiConfig.find((c) => c.serviceId === item.id);
    }
    if (include.subscription && modelName === 'tenant') {
      res.subscription = this.db.subscription.find((s) => s.tenantId === item.id);
    }
    if (include.businessProfile && modelName === 'tenant') {
      res.businessProfile = this.db.tenantBusinessProfile.find((b) => b.tenantId === item.id);
    }
    if (include.callingSettings && modelName === 'tenant') {
      res.callingSettings = this.db.tenantCallingSetting.find((c) => c.tenantId === item.id);
    }
    if (include.services && modelName === 'tenant') {
      res.services = this.db.service.filter((s) => s.tenantId === item.id);
    }
    if (include.memberships && modelName === 'user') {
      res.memberships = this.db.tenantMembership
        .filter((m) => m.userId === item.id)
        .map((m) => ({
          ...m,
          tenant: this.db.tenant.find((t) => t.id === m.tenantId),
        }));
    }
    if (include.calls) {
      res.calls = this.db.call.filter((c) => c.leadId === item.id);
    }
    if (include.followUps) {
      res.followUps = this.db.followUp.filter((f) => f.leadId === item.id || f.contactId === item.id);
    }
    if (include._count) {
      res._count = {
        leads: this.db.lead.filter((l) => l.tenantId === item.id || l.serviceId === item.id).length,
        calls: this.db.call.filter((c) => c.tenantId === item.id || c.serviceId === item.id).length,
        services: this.db.service.filter((s) => s.tenantId === item.id).length,
        customers: this.db.customer.filter((c) => c.tenantId === item.id).length,
      };
    }

    return res;
  }
}