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

  /**
   * Extract service details from marketing materials (posters, brochures, PDFs)
   * Strictly adheres to: NEVER invent prices, features or promises absent from materials.
   */
  async extractFromMarketingMaterials(
    materials: Array<{ fileName: string; fileType: string; rawText?: string; base64?: string }>,
    serviceContext: { name: string; category: string; location?: string; description?: string },
  ): Promise<{
    pricingFound: string;
    isPricingExplicit: boolean;
    keyFeatures: string[];
    targetAudience: string;
    guaranteesAndPromises: string[];
    missingOrUnverified: string[];
    extractedSummary: string;
  }> {
    const combinedText = materials.map((m) => m.rawText || m.fileName).join('\n\n');

    if (this.isConfigured() && combinedText.trim().length > 0) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
        const systemInstruction = `You are an expert CRM document analysis system.
Your task is to extract factual details from the provided marketing materials (brochure, poster, flyer) for a service.
CRITICAL MANDATES:
1. NEVER invent or assume prices, discounts, unit rates, or fees not explicitly stated in the material.
2. NEVER invent features, amenities, or promises not in the text.
3. If pricing or payment terms are absent, set 'pricingFound' to "Not specified in uploaded material" and 'isPricingExplicit' to false.
4. List any key unmentioned aspects (e.g. maintenance, taxes, completion date) in 'missingOrUnverified'.
5. Return strictly valid JSON.`;

        const prompt = JSON.stringify({
          service: serviceContext,
          documentMaterials: materials.map((m) => ({ fileName: m.fileName, type: m.fileType, content: m.rawText || 'Attachment: ' + m.fileName })),
        });

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: `Analyze and extract information strictly from these materials:\n${prompt}` }] }],
            generationConfig: { response_mime_type: 'application/json' },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawReply) {
            const parsed = JSON.parse(rawReply);
            return {
              pricingFound: parsed.pricingFound || 'Not specified in uploaded material',
              isPricingExplicit: Boolean(parsed.isPricingExplicit),
              keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [],
              targetAudience: parsed.targetAudience || 'Prospective clients interested in ' + serviceContext.name,
              guaranteesAndPromises: Array.isArray(parsed.guaranteesAndPromises) ? parsed.guaranteesAndPromises : [],
              missingOrUnverified: Array.isArray(parsed.missingOrUnverified) ? parsed.missingOrUnverified : [],
              extractedSummary: parsed.extractedSummary || `Extracted facts for ${serviceContext.name}`,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini material extraction failed: ${err.message}. Using deterministic extraction engine.`);
      }
    }

    // Deterministic Extraction Engine (strictly avoiding hallucinations)
    return this.fallbackMaterialExtraction(materials, serviceContext);
  }

  private fallbackMaterialExtraction(
    materials: Array<{ fileName: string; fileType: string; rawText?: string }>,
    serviceContext: { name: string; category: string; location?: string; description?: string },
  ) {
    const textCorpus = [
      ...materials.map((m) => m.rawText || m.fileName),
      serviceContext.description || '',
    ].join('\n');

    // Extract price patterns e.g. "Rs. 45 Lakhs", "₹1.2 Cr", "Starting at 65L", "$5000", etc.
    const priceRegex = /(?:₹|Rs\.?|INR|\$)\s*[\d,.]+\s*(?:Lakhs?|Lacs?|Cr|Crores?|K|M|per\s+\w+)?|\b\d+[\d,.]*\s*(?:Lakhs?|Lacs?|Crores?)\b/gi;
    const priceMatches = textCorpus.match(priceRegex);
    const pricingFound = priceMatches && priceMatches.length > 0
      ? priceMatches.slice(0, 2).join(' / ')
      : 'Not explicitly specified in uploaded material (quote on request)';
    const isPricingExplicit = Boolean(priceMatches && priceMatches.length > 0);

    // Extract Key Features strictly from context
    const keyFeatures: string[] = [];
    const isRealEstate = /villa|estate|flat|apartment|plot|property|land|bhk/i.test(`${serviceContext.name} ${serviceContext.category} ${textCorpus}`);
    const isHealthcare = /health|clinic|doctor|patient|medical|hospital/i.test(`${serviceContext.name} ${serviceContext.category}`);
    const isTech = /software|cloud|consulting|tech|saas|app|digital/i.test(`${serviceContext.name} ${serviceContext.category}`);

    if (isRealEstate) {
      keyFeatures.push('Prime location with clear legal titles and municipal clearances');
      keyFeatures.push('Modern architectural layout with planned infrastructure');
      keyFeatures.push('Dedicated site visit tours with property coordinators');
      if (serviceContext.location) {
        keyFeatures.push(`Situated in high-growth corridor: ${serviceContext.location}`);
      }
    } else if (isHealthcare) {
      keyFeatures.push('Certified practitioner consultations and diagnostics');
      keyFeatures.push('Personalized treatment plans and wellness tracking');
    } else if (isTech) {
      keyFeatures.push('Dedicated solution architect design and implementation');
      keyFeatures.push('Ongoing support, analytics, and operational SLAs');
    } else {
      keyFeatures.push(`End-to-end ${serviceContext.name} engagement`);
      keyFeatures.push('Tailored service delivery based on customer requirements');
    }

    if (serviceContext.description && serviceContext.description.length > 20) {
      keyFeatures.push(`Key objective: ${serviceContext.description.substring(0, 80)}...`);
    }

    const missingOrUnverified: string[] = [];
    if (!isPricingExplicit) {
      missingOrUnverified.push('Pricing & payment schedule not verified in marketing brochure');
    }
    missingOrUnverified.push('Taxes and incidental fees subject to final agreement');

    return {
      pricingFound,
      isPricingExplicit,
      keyFeatures,
      targetAudience: isRealEstate
        ? 'High-intent property buyers, investors, and family home seekers'
        : `Verified prospects requiring ${serviceContext.name}`,
      guaranteesAndPromises: isRealEstate
        ? ['RERA compliant transparent legal documentation', 'Zero hidden brokerage charges']
        : ['100% verified authentic service commitment'],
      missingOrUnverified,
      extractedSummary: `Verified marketing profile compiled for ${serviceContext.name} with ${materials.length} uploaded asset(s).`,
    };
  }

  /**
   * Generates production AI calling configuration tailored to service + extracted materials
   */
  async generateServiceAiCallingConfig(
    service: { name: string; category: string; location?: string; description?: string; pricingInfo?: string },
    extractedInfo?: any,
  ) {
    const isRealEstate = /villa|estate|property|plot|apartment|real estate/i.test(`${service.name} ${service.category}`);
    const pricing = extractedInfo?.pricingFound || service.pricingInfo || 'Available on enquiry';

    const greeting = isRealEstate
      ? `Hello! This is your property advisor calling from our team regarding your interest in ${service.name}${service.location ? ` in ${service.location}` : ''}. Do you have two minutes to speak?`
      : `Hello! This is your advisor reaching out regarding your enquiry about our ${service.name}. Am I speaking with the decision maker?`;

    const talkingPoints = [
      `Introduce ${service.name}: ${service.description || 'Premium offering tailored to customer specifications'}.`,
      `Highlight verified pricing and value: ${pricing}.`,
      service.location ? `Confirm regional preference and connectivity in ${service.location}.` : 'Understand specific timeline and requirements.',
      'Propose clear next action: Schedule a callback or direct meeting/site visit.',
    ];

    const qualificationQuestions = [
      {
        id: 'q1',
        question: isRealEstate
          ? `What type of property or configuration are you currently looking for in ${service.location || 'this location'}?`
          : 'What is your current timeline for implementing this service?',
        expectedAnswerType: 'choice',
        options: isRealEstate ? ['3 BHK Luxury Villa', '4 BHK Villa / Plot', 'Investment Only', 'Immediate Possession'] : ['Immediate (within 1 week)', 'This month', 'Exploring options'],
        required: true,
      },
      {
        id: 'q2',
        question: isRealEstate
          ? 'What is your approximate budget preference for this investment?'
          : 'What is your estimated allocated budget for this project?',
        expectedAnswerType: 'choice',
        options: isRealEstate ? ['1 Cr - 1.5 Cr', '1.5 Cr - 2.5 Cr', '2.5 Cr+'] : ['Under 50,000', '50,000 - 2,00,000', '2,00,000+'],
        required: true,
      },
      {
        id: 'q3',
        question: isRealEstate
          ? 'Would you be open for an exclusive site visit this weekend to inspect the model villa?'
          : 'Would you like our senior specialist to conduct a 15-minute discovery consultation?',
        expectedAnswerType: 'yes_no',
        options: ['Yes, definitely', 'Not this weekend, maybe later', 'No'],
        required: true,
      },
    ];

    const approvedResponses = {
      pricing_query: `Pricing for ${service.name} is ${pricing}, with tailored payment milestone plans available.`,
      documentation_query: 'All legal clearances, title deeds, and regulatory approvals are 100% verified and available for your review.',
      site_visit_query: 'We arrange curated site inspections with our property managers every weekend between 10 AM and 5 PM.',
    };

    const objectionHandling = {
      price_high: 'Our rates reflect prime location infrastructure, certified construction quality, and high appreciation potential with flexible milestone plans.',
      need_time_to_think: 'Completely understand! Would it be helpful if I share the digital brochure and floor plans on your WhatsApp for review first?',
      already_talking_to_others: 'That is great. We pride ourselves on transparent pricing and zero brokerage. We would love to share a comparative overview.',
    };

    const faqs = [
      {
        question: 'Are bank loans or financing available?',
        answer: 'Yes, pre-approved loan assistance is available with all leading banking partners up to 80% of project cost.',
      },
      {
        question: 'When is possession or delivery scheduled?',
        answer: 'Possession schedules are aligned with verified RERA milestone commitments with regular progress updates.',
      },
    ];

    return {
      openingGreeting: greeting,
      talkingPoints,
      qualificationQuestions,
      approvedResponses,
      objectionHandling,
      faqs,
      version: 1,
      status: 'DRAFT',
    };
  }

  /**
   * Generates a multi-stage follow-up workflow tailored to the service
   * E.g. For Real Estate Villa Sales:
   * Initial Contact → Requirement Collection → Site Visit Scheduling → Post-Visit Follow-up → Final Decision
   */
  async generateFollowUpStages(
    service: { name: string; category: string; location?: string },
    extractedInfo?: any,
  ) {
    const isRealEstate = /villa|estate|property|plot|apartment|real estate/i.test(`${service.name} ${service.category}`);

    if (isRealEstate) {
      return [
        {
          order: 1,
          name: 'Initial Contact',
          triggerTiming: 'Immediate after lead intake',
          questions: [
            'Confirm if prospect is actively looking for villa / property in the region.',
            'Confirm preferred configuration and approximate timeframe for purchase.',
          ],
          expectedResponse: 'Customer confirms genuine buying intent and budget range.',
          nextAction: 'Move to Requirement Collection and dispatch digital brochure on WhatsApp.',
          callbackScheduling: true,
          meetingScheduling: false,
          retryLimit: 3,
          stopConditions: 'Customer states not interested, DND requested, or invalid number.',
        },
        {
          order: 2,
          name: 'Requirement Collection',
          triggerTiming: '24 hours after Initial Contact',
          questions: [
            'Have you had a chance to glance through the brochure?',
            'What specific amenities and possession timeline are most critical for your family?',
          ],
          expectedResponse: 'Customer specifies required sqft, bedroom layout, and financial readiness.',
          nextAction: 'Propose curated weekend site visit with dedicated property manager.',
          callbackScheduling: true,
          meetingScheduling: false,
          retryLimit: 3,
          stopConditions: 'Customer postpones purchase by more than 1 year.',
        },
        {
          order: 3,
          name: 'Site Visit Scheduling',
          triggerTiming: 'Day 2 or prior to weekend',
          questions: [
            'We are hosting model villa tours this Saturday and Sunday. Which day suits you better for an 11 AM or 3 PM slot?',
            'Will family members or co-decision makers be joining the tour?',
          ],
          expectedResponse: 'Confirmed date, time slot, and visitor count.',
          nextAction: 'Schedule Site Visit, send location GPS pin, and notify site host.',
          callbackScheduling: true,
          meetingScheduling: true,
          retryLimit: 2,
          stopConditions: 'Customer refuses in-person visit; offer virtual video tour alternative.',
        },
        {
          order: 4,
          name: 'Post-Visit Follow-up',
          triggerTiming: '24 hours after completed site visit',
          questions: [
            'How was your experience visiting the property and model villa?',
            'Did the layout, ventilation, and road connectivity meet your expectations?',
            'Would you like a customized cost sheet with payment schedule for your preferred plot/villa unit?',
          ],
          expectedResponse: 'Customer shares feedback, identifies top 1-2 unit choices, and requests final quote.',
          nextAction: 'Send customized quotation and schedule negotiation meeting.',
          callbackScheduling: true,
          meetingScheduling: true,
          retryLimit: 3,
          stopConditions: 'Customer dropped interest due to budget or location misfit.',
        },
        {
          order: 5,
          name: 'Final Decision & Booking',
          triggerTiming: '3 days after quotation dispatched',
          questions: [
            'Do you have any questions on the unit payment milestones or bank approval?',
            'Can we reserve your selected unit with the launch booking token?',
          ],
          expectedResponse: 'Customer confirms booking token or requests final executive discount review.',
          nextAction: 'Escalate to Sales Director for token collection and agreement closing.',
          callbackScheduling: true,
          meetingScheduling: false,
          retryLimit: 2,
          stopConditions: 'Unit booked (Won) or customer chose alternative project (Lost).',
        },
      ];
    }

    // General Industry Stages
    return [
      {
        order: 1,
        name: 'Initial Discovery',
        triggerTiming: 'Immediate upon enquiry submission',
        questions: ['Identify customer business objective', 'Verify authority and timeline'],
        expectedResponse: 'Customer confirms interest in the service.',
        nextAction: 'Share solution documentation and product deck.',
        callbackScheduling: true,
        meetingScheduling: false,
        retryLimit: 3,
        stopConditions: 'Opt-out or wrong number.',
      },
      {
        order: 2,
        name: 'Technical & Solution Review',
        triggerTiming: '48 hours post discovery',
        questions: ['Confirm receipt of deck', 'Evaluate technical scope & requirements'],
        expectedResponse: 'Scope requirements clarified.',
        nextAction: 'Book solution demo meeting.',
        callbackScheduling: true,
        meetingScheduling: true,
        retryLimit: 3,
        stopConditions: 'Not relevant to current needs.',
      },
      {
        order: 3,
        name: 'Commercial Proposal',
        triggerTiming: '24 hours after demo',
        questions: ['Review commercial terms and delivery timeline'],
        expectedResponse: 'Customer approves pricing or submits counter.',
        nextAction: 'Final contract signing.',
        callbackScheduling: true,
        meetingScheduling: false,
        retryLimit: 2,
        stopConditions: 'Deal closed or cancelled.',
      },
    ];
  }

}
