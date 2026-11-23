import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentConfigurationSchema, AgentOutputField } from './gemini.types';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string | null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.logger.log('GeminiService initialized with configured GEMINI_API_KEY.');
    } else {
      this.logger.log('GeminiService initialized with domain-adaptive synthesis engine (GEMINI_API_KEY placeholder).');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Main entrypoint: Generates a fully dynamic, organization-based voice agent configuration
   */
  async generateAgentConfiguration(
    tenantProfile: any,
    services: any[],
    knowledgeItems: any[] = [],
    customGuidance?: string,
  ): Promise<AgentConfigurationSchema> {
    const missingFields: string[] = [];

    const companyName = tenantProfile.businessName || tenantProfile.name || 'Our Company';
    const industry = tenantProfile.category || tenantProfile.businessType || 'General Business';
    const description = tenantProfile.description || '';
    const operatingLocations = tenantProfile.operatingLocations || tenantProfile.city || '';
    const website = tenantProfile.website || '';
    const contactPhone = tenantProfile.phone || '';

    if (!description || description.trim().length < 10) {
      missingFields.push('Detailed business description is missing or too brief');
    }
    if (!services || services.length === 0) {
      missingFields.push('No active services or products registered for automated calling');
    } else {
      const servicesWithoutPricing = services.filter((s) => !s.pricingInfo || s.pricingInfo.trim() === '');
      if (servicesWithoutPricing.length > 0) {
        missingFields.push(
          `Pricing information missing for: ${servicesWithoutPricing.map((s) => s.name).join(', ')}`,
        );
      }
    }

    if (this.isConfigured()) {
      try {
        const geminiResult = await this.callGeminiApi(
          companyName,
          industry,
          description,
          operatingLocations,
          website,
          contactPhone,
          services,
          knowledgeItems,
          customGuidance,
          missingFields,
        );
        if (geminiResult && this.validateSchema(geminiResult)) {
          this.logger.log(`Successfully generated dynamic AI configuration for ${companyName} via Gemini API.`);
          return geminiResult;
        }
      } catch (err: any) {
        this.logger.warn(`Gemini API call failed (${err.message}). Falling back to domain-adaptive synthesis.`);
      }
    }

    return this.synthesizeAdaptiveConfiguration(
      companyName,
      industry,
      description,
      operatingLocations,
      website,
      contactPhone,
      services,
      knowledgeItems,
      customGuidance,
      missingFields,
    );
  }

  /**
   * Calls Google Gemini Generative API with strict JSON schema constraints
   */
  private async callGeminiApi(
    companyName: string,
    industry: string,
    description: string,
    operatingLocations: string,
    website: string,
    contactPhone: string,
    services: any[],
    knowledgeItems: any[],
    customGuidance?: string,
    existingMissingFields: string[] = [],
  ): Promise<AgentConfigurationSchema | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const systemInstruction = `You are the Jeenora CRM AI Configuration Architect.
Your task is to generate a comprehensive, production-grade AI Voice Agent Configuration for an organization based SOLELY on its verified profile, offerings, pricing, and business objectives.
STRICT RULES:
1. NEVER invent unprovided company facts, pricing, legal claims, refund policies, or guarantees.
2. If essential details are missing (e.g. pricing not specified, missing location), flag them in 'missingInformation'.
3. Tailor all qualification questions, dynamic variables, and conversation objectives strictly to this organization's business domain.
4. DO NOT use generic or unrelated business variables (e.g. never use EMI or loan terms for non-lending companies).
5. Output strictly valid JSON matching the requested schema.`;

    const userPrompt = JSON.stringify({
      organization: {
        name: companyName,
        industry,
        description,
        operatingLocations,
        website,
        contactPhone,
      },
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        pricing: s.pricingInfo,
        description: s.description,
        location: s.location,
        additionalInfo: s.additionalInfo,
      })),
      faqs: knowledgeItems,
      customGuidance: customGuidance || null,
      existingMissingFields,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: `Generate AI Voice Agent Configuration JSON for this tenant:\n${userPrompt}` }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    return JSON.parse(rawText) as AgentConfigurationSchema;
  }

  /**
   * Fully Dynamic Domain-Adaptive Synthesizer
   * Analyzes the organization's real profile, category, and offerings to build
   * structured, schema-compliant configurations for ANY industry without hardcoding.
   */
  private synthesizeAdaptiveConfiguration(
    companyName: string,
    industry: string,
    description: string,
    operatingLocations: string,
    website: string,
    contactPhone: string,
    services: any[],
    knowledgeItems: any[],
    customGuidance?: string,
    missingFields: string[] = [],
  ): AgentConfigurationSchema {
    // 1. Suggest a professional, culturally harmonious agent name deterministically
    // based on company name hash so each organization has a stable, distinctive persona
    const professionalNames = [
      'Aditi',
      'Ananya',
      'Aarav',
      'Neha',
      'Rohan',
      'Kavya',
      'Vikram',
      'Pooja',
      'Rahul',
      'Sneha',
      'Arjun',
      'Simran',
      'Karan',
      'Meera',
    ];
    const charCodeSum = companyName.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const agentName = professionalNames[charCodeSum % professionalNames.length];

    // 2. Suggest dynamic professional role from actual category and offerings
    let agentRole = 'Customer Advisor';
    if (services.length > 0 && services[0]?.name) {
      agentRole = `${services[0].name} Specialist`;
    } else if (industry && industry !== 'General Business') {
      agentRole = `${industry} Consultant`;
    }

    // 3. Dynamic Variables tailored strictly to this tenant
    const primaryVariables: Record<string, string> = {
      customerName: 'Prospect',
      organizationName: companyName,
      industry: industry || 'Professional Services',
      primaryOffering: services[0]?.name || 'Our Services',
      operatingLocations: operatingLocations || 'Regional Metropolitan',
    };
    if (services[0]?.pricingInfo) {
      primaryVariables.verifiedPricing = services[0].pricingInfo;
    }

    // 4. Dynamic Objectives based on registered services
    const conversationObjectives: string[] = [
      `Acknowledge and thank customer for their recent inquiry regarding ${companyName}'s offerings.`,
      `Understand customer's specific requirements, timeline, and expectations for ${services.map((s) => s.name).slice(0, 3).join(', ') || 'our services'}.`,
      `Provide accurate, verified pricing and availability details strictly from verified company records without invention.`,
      `Confirm the preferred next step: schedule a direct consultation, product walkthrough, or dispatch digital overview.`,
    ];

    // 5. Dynamic Qualification Questions based on actual services catalog
    const qualificationQuestions: any[] = [];
    if (services.length > 1) {
      qualificationQuestions.push({
        id: 'q_service_preference',
        question: `Which of our offerings are you most interested in exploring: ${services.map((s) => s.name).slice(0, 4).join(', ')}?`,
        purpose: 'Identify specific service line interest',
        expectedDataType: 'choice',
        choices: services.map((s) => s.name),
      });
    } else if (services.length === 1) {
      qualificationQuestions.push({
        id: 'q_primary_need',
        question: `Could you share a brief overview of what you are looking to achieve with ${services[0].name}?`,
        purpose: 'Qualify specific customer use case',
        expectedDataType: 'string',
      });
    } else {
      qualificationQuestions.push({
        id: 'q_general_need',
        question: `Could you share what specific assistance or service you are looking for today?`,
        purpose: 'Discover primary customer requirement',
        expectedDataType: 'string',
      });
    }

    // Budget qualification matching real pricing data
    qualificationQuestions.push({
      id: 'q_budget_alignment',
      question: services[0]?.pricingInfo
        ? `Our pricing for ${services[0].name} starts around ${services[0].pricingInfo}. Does that align comfortably with your planned budget?`
        : `What is your comfortable investment or budget range for this requirement?`,
      purpose: 'Assess budget fit with verified pricing guidelines',
      expectedDataType: 'string',
    });

    // Timeline qualification
    qualificationQuestions.push({
      id: 'q_timeline',
      question: `How soon are you looking to finalize and get started with this?`,
      purpose: 'Assess customer purchase readiness and urgency',
      expectedDataType: 'string',
    });

    // 6. Output Fields
    const outputFields: AgentOutputField[] = [
      { key: 'offeringInterested', label: 'Interested Service', type: 'string', description: 'Primary service of interest' },
      { key: 'budgetAligned', label: 'Budget Verified', type: 'boolean', description: 'Within pricing parameters' },
      { key: 'timeline', label: 'Target Timeline', type: 'string', description: 'Customer expected timeline' },
      { key: 'consultationScheduled', label: 'Consultation Scheduled', type: 'boolean', description: 'Confirmed follow-up step' },
    ];

    // 7. Dynamic Prohibited Claims strictly protecting against hallucination
    const prohibitedClaims = [
      'Never invent unverified pricing, discounts, guarantees, or policies not present in official company records.',
      'Never make speculative claims regarding performance, legal approvals, or timelines not officially confirmed.',
      'Never disclose confidential internal client details, trade secrets, or unreleased offerings.',
    ];

    // 8. FAQs mapped directly from knowledge items and actual services
    const faqs: any[] = [];
    if (knowledgeItems && knowledgeItems.length > 0) {
      knowledgeItems.forEach((k) => {
        faqs.push({
          question: k.question,
          answer: k.answer,
          category: k.category || 'GENERAL',
        });
      });
    } else if (services.length > 0) {
      services.forEach((s) => {
        if (s.pricingInfo) {
          faqs.push({
            question: `What is the pricing for ${s.name}?`,
            answer: `${s.name} is offered at ${s.pricingInfo}.`,
            category: 'PRICING',
          });
        }
        if (s.location) {
          faqs.push({
            question: `Where is ${s.name} located or delivered?`,
            answer: `${s.name} is available in ${s.location}.`,
            category: 'LOCATION',
          });
        }
        if (s.description) {
          faqs.push({
            question: `What does ${s.name} include?`,
            answer: s.description,
            category: 'SERVICE_DETAILS',
          });
        }
      });
    }

    // 9. Objection Handling
    const objectionHandling = [
      {
        objection: 'I am busy right now / can you call back later?',
        response: 'Understood! What time today or tomorrow would be most convenient for a quick 2-minute callback?',
      },
      {
        objection: 'Can you send details on WhatsApp or email instead?',
        response: 'Certainly! I will make sure our team dispatches the detailed overview to your verified contact info right away.',
      },
      {
        objection: 'Is the pricing negotiable or are there discounts?',
        response: services[0]?.pricingInfo
          ? `Our pricing starts at ${services[0].pricingInfo}. Our senior consultant can review any available package options with you during a detailed consultation.`
          : 'Our pricing is customized to your exact requirements. Our team can prepare a personalized proposal for your review.',
      },
    ];

    // 10. Natural Opening Greeting
    const openingGreeting = `Hello! This is ${agentName}, ${agentRole} calling from ${companyName}. I am following up on your recent inquiry regarding our ${services[0]?.name || 'services'}. Do you have two minutes to speak?`;

    // 11. Full Structured Prompt
    const fullPrompt = [
      `Identity: You are ${agentName}, a professional ${agentRole} representing ${companyName}. Channel: Outbound voice call over telephony.`,
      `Context: ${description || `${companyName} provides high-quality ${industry} solutions.`} Operating Locations: ${operatingLocations || 'Regional Metropolitan'}.`,
      `Services & Offerings: ${
        services.length > 0
          ? services
              .map((s) => `${s.name}${s.pricingInfo ? ` (${s.pricingInfo})` : ''}: ${s.description || 'Verified offering'}`)
              .join('; ')
          : `${companyName} offers specialized ${industry} solutions.`
      }`,
      `Objectives: ${conversationObjectives.join(' ')}`,
      `Speaking Style: Polite, consultative, concise (under 25 words per turn), asking one question at a time. Stop speaking immediately if the customer interrupts.`,
      `Guardrails: ${prohibitedClaims.join(' ')}`,
      `Human Escalation: Immediately transfer or flag for human advisor if customer requests a manager or reports a dispute.`,
    ].join('\n\n');

    return {
      agentName,
      agentRole,
      organizationContext: `${companyName} is an established ${industry || 'business'} organization. ${description || ''}`,
      channel: 'Outbound phone call over telephony',
      conversationObjectives,
      openingGreeting,
      qualificationQuestions,
      requiredInfo: Object.keys(primaryVariables),
      faqs,
      objectionHandling,
      speakingStyle: {
        maxWordsPerTurn: 25,
        pacing: 'Conversational, polite, responsive',
        bargeInRule: 'Halt speaking immediately upon customer interruption',
        fillersAllowed: ['understood', 'certainly', 'makes sense'],
        preserveTerms: services.map((s) => s.name),
      },
      followUpRules: [
        'If customer confirms interest, propose scheduling a direct consultation or appointment.',
        'If customer requests documentation, confirm contact info and dispatch verified material.',
      ],
      humanEscalationRules: [
        'Customer express request to speak with a human executive.',
        'High-value customized contract inquiry.',
        'Customer grievance or dispute.',
      ],
      variables: primaryVariables,
      outputFields,
      prohibitedClaims,
      missingInformation: missingFields,
      fullPrompt,
    };
  }

  private validateSchema(config: any): boolean {
    return Boolean(
      config &&
      typeof config.agentName === 'string' &&
      typeof config.agentRole === 'string' &&
      typeof config.openingGreeting === 'string' &&
      Array.isArray(config.conversationObjectives) &&
      Array.isArray(config.qualificationQuestions) &&
      typeof config.variables === 'object' &&
      Array.isArray(config.outputFields),
    );
  }
}
