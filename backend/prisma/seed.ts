import { PrismaClient, UserRole, TenantStatus, ServiceApprovalStatus, LeadStatus, InterestLevel, CallStatus, CallOutcome } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Multi-Tenant Enterprise AI CRM database...');

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const clientPasswordHash = await bcrypt.hash('Client@123456', salt);

  // 1. Create Global Platform Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acrmplatform.com' },
    update: {},
    create: {
      email: 'admin@acrmplatform.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Super Platform Admin',
      phone: '+919900011223',
      role: UserRole.PLATFORM_ADMIN,
      isActive: true,
    },
  });

  // 2. Seed Global Settings
  const defaultSettings = [
    { key: 'sarvam_api_key', value: 'srv_live_default_key_2026', category: 'AI_PROVIDER' },
    { key: 'sarvam_base_url', value: 'https://api.sarvam.ai/v1', category: 'AI_PROVIDER' },
    { key: 'ai_minute_rate', value: '1.50', category: 'PRICING' },
    { key: 'telephony_minute_rate', value: '0.40', category: 'PRICING' },
    { key: 'calling_start_hour', value: '9', category: 'CALLING_RULES' },
    { key: 'calling_end_hour', value: '20', category: 'CALLING_RULES' },
    { key: 'concurrency_limit', value: '50', category: 'CALLING_RULES' },
    { key: 'default_language', value: 'hi-IN', category: 'CALLING_RULES' },
  ];

  for (const s of defaultSettings) {
    await prisma.globalSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 3. AI Conversation Templates
  const realEstateTemplate = await prisma.aiConversationTemplate.upsert({
    where: { id: 'template-realestate-v1' },
    update: {},
    create: {
      id: 'template-realestate-v1',
      name: 'Real Estate Property Enquiry Qualification',
      description: 'Engages leads for plot, apartment, or villa enquiries, answers location questions and books visits.',
      industry: 'Real Estate',
      openingIntro: 'Namaste! Main {companyName} se baat kar rahi hoon. Aapne hamare property projects ke baare mein online enquiry ki thi. Kya main aapse 2 minute baat kar sakti hoon?',
      instructions: 'Be polite, friendly, and professional. Introduce the property project clearly, answer queries concisely, check budget and location preference, and schedule a site visit.',
      qualificationQuestions: [
        { id: 'q1', question: 'Aap kis location mein property dekh rahe hain?', expectedAnswerType: 'choice', options: ['North', 'East', 'South', 'West'] },
        { id: 'q2', question: 'Aapka approximate budget range kya hai?', expectedAnswerType: 'choice', options: ['30L - 50L', '50L - 1Cr', '1Cr+'] },
        { id: 'q3', question: 'Kya aap is weekend site visit ke liye aa sakte hain?', expectedAnswerType: 'yes_no' },
      ],
      approvedResponses: {
        'rera_approved': 'Haanji, hamara project 100% RERA approved hai aur sabhi legal clearance complete hain.',
        'bank_loan': 'SBI, HDFC, aur ICICI samet sabhi major banks se 80% tak home loan facility available hai.',
        'possession': 'Project ka possession December 2026 tak scheduled hai.',
      },
      objectionHandling: {
        'price_high': 'Sir hamare location par infrastructure aur connectivity ko dekhte hue rate bohot competitive hain aur early buyers ke liye exclusive launch discount bhi chal raha hai.',
        'not_interested': 'Koi baat nahi Sir, kya main aapko WhatsApp par project brochure share kar doon future reference ke liye?',
      },
      closingStatement: 'Dhanyawad aapke samay ke liye! Hamari team aapko details WhatsApp kar rahi hai. Shubh din!',
      defaultLanguage: 'hi-IN',
      defaultVoice: 'meera',
      version: 1,
    },
  });

  // 4. Create Sample Client Tenant: JJ Real Estate
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'jj-real-estate' },
    update: {},
    create: {
      id: 'tenant-jj-real-estate-001',
      name: 'JJ Real Estate Developers',
      slug: 'jj-real-estate',
      email: 'contact@jjrealestate.in',
      phone: '+919876500001',
      businessType: 'Real Estate & Infrastructure',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      status: TenantStatus.ACTIVE,
      aiCallingEnabled: true,
      monthlyCallingLimit: 2000,
      usedCallingMinutes: 142.5,
    },
  });

  // Admin user for JJ Real Estate
  const tenantAdmin = await prisma.user.upsert({
    where: { email: 'client@jjrealestate.in' },
    update: {},
    create: {
      id: 'user-client-jj-001',
      email: 'client@jjrealestate.in',
      passwordHash: clientPasswordHash,
      fullName: 'Jayant Joshi',
      phone: '+919876500002',
      role: UserRole.TENANT_ADMIN,
      isActive: true,
    },
  });

  // Membership
  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant1.id,
        userId: tenantAdmin.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant1.id,
      userId: tenantAdmin.id,
      role: 'ADMIN',
    },
  });

  // Business Profile
  await prisma.tenantBusinessProfile.upsert({
    where: { tenantId: tenant1.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      businessName: 'JJ Real Estate Developers LLP',
      category: 'Real Estate Developer',
      description: 'Premier residential township and commercial development firm operating in western India with over 15 delivered projects.',
      website: 'https://jjrealestate.in',
      address: 'Pride Icon, Senapati Bapat Road, Pune',
      operatingLocations: 'Pune, Hinjawadi, Wagholi, Baner',
      primaryObjective: 'Automate first-line inbound lead calling and schedule on-site visits with prospective buyers.',
    },
  });

  // Subscription
  await prisma.subscription.upsert({
    where: { tenantId: tenant1.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      planName: 'Enterprise AI Calling Pro',
      status: 'ACTIVE',
      callingLimitMinutes: 2000,
      validityUntil: new Date(Date.now() + 300 * 24 * 3600 * 1000),
      initialCredits: 3000,
    },
  });

  // Calling Settings
  await prisma.tenantCallingSetting.upsert({
    where: { tenantId: tenant1.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      startHour: 10,
      endHour: 19,
      maxDailyCalls: 300,
      maxRetries: 3,
      retryIntervalMinutes: 180,
      timezone: 'Asia/Kolkata',
      isAutomatedCallingEnabled: true,
    },
  });

  // 5. Tenant Services
  const plotService = await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant1.id,
        name: 'Residential Plots',
      },
    },
    update: {},
    create: {
      tenantId: tenant1.id,
      name: 'Residential Plots',
      category: 'Land & Plots',
      description: 'Gated community residential NA plots in Wagholi with clubhouse, wide roads and clear titles.',
      location: 'Wagholi, Pune',
      pricingInfo: 'Starting at 35 Lakhs for 1500 sq.ft.',
      approvalStatus: ServiceApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  const aptService = await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant1.id,
        name: 'Luxury Apartments',
      },
    },
    update: {},
    create: {
      tenantId: tenant1.id,
      name: 'Luxury Apartments',
      category: 'Residential High-Rise',
      description: '2 & 3 BHK premium high-rise apartments in Baner with rooftop infinity pool and smart home automation.',
      location: 'Baner, Pune',
      pricingInfo: 'Starting at 85 Lakhs',
      approvalStatus: ServiceApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  const villaService = await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant1.id,
        name: 'Villa Sales',
      },
    },
    update: {},
    create: {
      tenantId: tenant1.id,
      name: 'Villa Sales',
      category: 'Independent Villas',
      description: 'Custom-designed 4 BHK luxury villas with private gardens.',
      location: 'Hinjawadi Phase 3',
      pricingInfo: 'Starting at 1.8 Cr',
      approvalStatus: ServiceApprovalStatus.PENDING_APPROVAL,
      isActive: true,
    },
  });

  // 6. Approved Service AI Config for Residential Plots
  await prisma.serviceAiConfig.upsert({
    where: { serviceId: plotService.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      serviceId: plotService.id,
      templateId: realEstateTemplate.id,
      companyIdentity: 'JJ Real Estate',
      serviceDescription: 'Hamare residential plots Wagholi mein hain, jo ki clear title aur PMRDA approved hain.',
      openingIntro: 'Namaste! Main JJ Real Estate se baat kar rahi hoon. Aapne Wagholi Residential Plots ke baare mein enquire kiya tha.',
      instructions: 'Confirm customer location, budget range, and invite for this weekend site visit.',
      qualificationQuestions: [
        { id: 'q1', question: 'Aap investment ke liye dekh rahe hain ya khud ka ghar banane ke liye?', expectedAnswerType: 'choice', options: ['Investment', 'Self-use'] },
        { id: 'q2', question: 'Kya aap is Shanivar ya Ravivar site visit ke liye aa sakte hain?', expectedAnswerType: 'yes_no' },
      ],
      approvedResponses: {
        'rera': 'Project RERA registered hai: P52100028912.',
        'amenities': 'Clubhouse, swimming pool, jogging track, aur 24x7 gated security available hai.',
      },
      objectionHandling: {
        'distance': 'Sir Hinjawadi bypass aur metro line se connect ho raha hai, toh travel time bohot kam ho jayega.',
      },
      language: 'hi-IN',
      voice: 'meera',
      maxDurationSeconds: 300,
      closingStatement: 'Dhanyawad! Hamare sales manager aapko location map WhatsApp kar rahe hain.',
      status: 'APPROVED',
      version: 1,
    },
  });

  // 7. Contacts & Leads (Single Source of Truth)
  const contact1 = await prisma.contact.upsert({
    where: {
      tenantId_phone: {
        tenantId: tenant1.id,
        phone: '+919822011223',
      },
    },
    update: {},
    create: {
      tenantId: tenant1.id,
      fullName: 'Arun Kulkarni',
      phone: '+919822011223',
      email: 'arun.kulkarni@gmail.com',
      location: 'Kothrud, Pune',
      consentGranted: true,
      consentSource: 'Website Landing Page Enquiry',
    },
  });

  const contact2 = await prisma.contact.upsert({
    where: {
      tenantId_phone: {
        tenantId: tenant1.id,
        phone: '+919822044556',
      },
    },
    update: {},
    create: {
      tenantId: tenant1.id,
      fullName: 'Priya Sharma',
      phone: '+919822044556',
      email: 'priya.sharma@outlook.com',
      location: 'Viman Nagar, Pune',
      consentGranted: true,
      consentSource: 'Excel Lead Import',
    },
  });

  const lead1 = await prisma.lead.upsert({
    where: { id: 'lead-arun-plots-01' },
    update: {},
    create: {
      id: 'lead-arun-plots-01',
      tenantId: tenant1.id,
      contactId: contact1.id,
      serviceId: plotService.id,
      leadSource: 'Google Ads Campaign',
      status: LeadStatus.QUALIFIED,
      interestLevel: InterestLevel.HIGH,
      aiCallingEligible: true,
      callAttempts: 1,
      lastCallDate: new Date(Date.now() - 3600 * 1000 * 24),
      qualificationNotes: 'Customer confirmed 40L budget. Interested in corner plot. Site visit booked for Saturday.',
    },
  });

  const lead2 = await prisma.lead.upsert({
    where: { id: 'lead-priya-apt-02' },
    update: {},
    create: {
      id: 'lead-priya-apt-02',
      tenantId: tenant1.id,
      contactId: contact2.id,
      serviceId: aptService.id,
      leadSource: 'Property Portal',
      status: LeadStatus.NEW_LEAD,
      interestLevel: InterestLevel.MEDIUM,
      aiCallingEligible: true,
      callAttempts: 0,
    },
  });

  // Call record for lead 1
  const call1 = await prisma.call.upsert({
    where: { id: 'call-arun-plots-01' },
    update: {},
    create: {
      id: 'call-arun-plots-01',
      tenantId: tenant1.id,
      leadId: lead1.id,
      serviceId: plotService.id,
      externalCallId: 'srv_call_9822011223_01',
      callerNumber: '+919810012345',
      recipientNumber: contact1.phone,
      status: CallStatus.COMPLETED,
      outcome: CallOutcome.QUALIFIED,
      durationSeconds: 145,
      billableSeconds: 145,
      recordingUrl: 'https://recordings.acrm-storage.com/srv_call_9822011223_01.mp3',
      transcript: '[AI (Meera)]: Namaste! Main JJ Real Estate se baat kar rahi hoon. Aapne Wagholi plots ke baare mein enquire kiya tha.\n[Arun]: Haan ji, plot sizes kya hain?\n[AI]: 1500 se 2500 sq.ft ke plots hain clear title ke saath.\n[Arun]: Theek hai, main Shanivar 11 baje visit kar sakta hoon.',
      summary: 'Customer verified interest in 1500 sqft residential plot. Confirmed Saturday 11 AM site visit.',
      costAmount: 3.65,
    },
  });

  // AI Usage Ledger
  await prisma.aiUsageLedger.upsert({
    where: { idempotencyKey: `usage_${call1.id}_01` },
    update: {},
    create: {
      tenantId: tenant1.id,
      callId: call1.id,
      billableMinutes: 2.42,
      providerCost: 2.3,
      billedToClient: 3.65,
      ratePerMinute: 1.5,
      currency: 'INR',
      idempotencyKey: `usage_${call1.id}_01`,
    },
  });

  // Villa Service Follow-up Stages
  const villaStages = [
    {
      order: 1,
      name: 'Initial Contact',
      triggerTiming: 'Immediate after lead intake',
      questions: ['Confirm interest in 4 BHK luxury villa in Hinjawadi', 'Check if planning self-occupancy or investment'],
      expectedResponse: 'Customer confirms interest in Hinjawadi luxury villa project.',
      nextAction: 'Dispatch WhatsApp brochure & schedule Requirement Collection',
      callbackScheduling: true,
      meetingScheduling: false,
      retryLimit: 3,
      stopConditions: 'Not interested / DND requested',
    },
    {
      order: 2,
      name: 'Requirement Collection',
      triggerTiming: 'Day 1 (24 hours after Initial Contact)',
      questions: ['Understand preferred carpet area (3200 vs 4000 sq.ft)', 'Confirm garden layout & parking requirements'],
      expectedResponse: 'Customer confirms preferred configuration and budget of 1.8 Cr - 2.5 Cr.',
      nextAction: 'Propose curated weekend site visit with property manager',
      callbackScheduling: true,
      meetingScheduling: false,
      retryLimit: 3,
      stopConditions: 'Budget mismatch or postponed purchase',
    },
    {
      order: 3,
      name: 'Site Visit Scheduling',
      triggerTiming: 'Day 2 (Pre-Weekend Invitation)',
      questions: ['Invite customer to model villa tour on Saturday or Sunday 11 AM', 'Confirm if family members will accompany'],
      expectedResponse: 'Confirmed date, time slot, and guest count.',
      nextAction: 'Confirm Site Visit booking, send GPS coordinates & notify host',
      callbackScheduling: true,
      meetingScheduling: true,
      retryLimit: 2,
      stopConditions: 'Customer declines physical visit; offer video tour',
    },
    {
      order: 4,
      name: 'Post-Visit Follow-up',
      triggerTiming: 'Day 4 (24 hours post site visit)',
      questions: ['Review feedback on model villa & construction quality', 'Present customized payment milestone schedule'],
      expectedResponse: 'Customer selects Villa Unit #14 and requests final cost sheet.',
      nextAction: 'Send formal quotation and coordinate final negotiation meeting',
      callbackScheduling: true,
      meetingScheduling: true,
      retryLimit: 3,
      stopConditions: 'Customer decides on alternative developer',
    },
    {
      order: 5,
      name: 'Final Decision & Booking',
      triggerTiming: 'Day 7 (Post quotation review)',
      questions: ['Review bank loan approval status & booking token agreement'],
      expectedResponse: 'Booking token payment received and agreement signed.',
      nextAction: 'Convert lead to active customer & issue formal receipt',
      callbackScheduling: true,
      meetingScheduling: false,
      retryLimit: 2,
      stopConditions: 'Deal Won or Lost',
    },
  ];

  await prisma.serviceFollowUpStage.deleteMany({
    where: { serviceId: villaService.id },
  });

  for (const stg of villaStages) {
    await prisma.serviceFollowUpStage.create({
      data: {
        tenantId: tenant1.id,
        serviceId: villaService.id,
        order: stg.order,
        name: stg.name,
        triggerTiming: stg.triggerTiming,
        questions: stg.questions,
        expectedResponse: stg.expectedResponse,
        nextAction: stg.nextAction,
        callbackScheduling: stg.callbackScheduling,
        meetingScheduling: stg.meetingScheduling,
        retryLimit: stg.retryLimit,
        stopConditions: stg.stopConditions,
      },
    });
  }

  // Follow-up records for Today, Upcoming, Overdue, and Completed
  const now = new Date();

  // 1. Overdue Follow-up
  await prisma.followUp.upsert({
    where: { id: 'followup-rohit-overdue' },
    update: {},
    create: {
      id: 'followup-rohit-overdue',
      tenantId: tenant1.id,
      contactId: contact1.id,
      leadId: lead1.id,
      serviceId: villaService.id,
      currentStage: 'Requirement Collection',
      title: 'Discuss 4 BHK Villa Carpet Area - Rohit Deshmukh',
      description: 'Review floor plan options and verify required possession timeline before site visit.',
      type: 'CALLBACK',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000), // 2 days ago (Overdue)
      status: 'OVERDUE',
      meetingStatus: 'NOT_APPLICABLE',
      assignedOwner: 'AI Voice Assistant (Simran)',
      callHistory: [
        {
          date: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
          duration: '1m 45s',
          outcome: 'Interested',
          summary: 'Customer requested floor plans for 3500 sq.ft villa.',
        },
      ],
    },
  });

  // 2. Today's Follow-up
  await prisma.followUp.upsert({
    where: { id: 'followup-priya-today' },
    update: {},
    create: {
      id: 'followup-priya-today',
      tenantId: tenant1.id,
      contactId: contact2.id,
      leadId: lead2.id,
      serviceId: villaService.id,
      currentStage: 'Site Visit Scheduling',
      title: 'Confirm Saturday Model Villa Visit - Priya Sharma',
      description: 'Confirm 11:30 AM arrival at Hinjawadi Phase 3 site office and send gate entry pass.',
      type: 'SITE_VISIT',
      priority: 'URGENT',
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30), // Today at 2:30 PM
      status: 'PENDING',
      meetingStatus: 'SCHEDULED',
      assignedOwner: 'Senior Property Consultant',
      callHistory: [
        {
          date: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
          duration: '2m 10s',
          outcome: 'Meeting Scheduled',
          summary: 'Confirmed Saturday visit with family.',
        },
      ],
    },
  });

  // 3. Upcoming Follow-up
  await prisma.followUp.upsert({
    where: { id: 'followup-arun-sitevisit' },
    update: {
      serviceId: villaService.id,
      currentStage: 'Post-Visit Follow-up',
      meetingStatus: 'SCHEDULED',
      assignedOwner: 'Relationship Manager (Rohan)',
    },
    create: {
      id: 'followup-arun-sitevisit',
      tenantId: tenant1.id,
      contactId: contact1.id,
      leadId: lead1.id,
      serviceId: villaService.id,
      currentStage: 'Post-Visit Follow-up',
      title: 'Post-Visit Villa Layout Review - Arun Kulkarni',
      description: 'Host Arun Kulkarni at Hinjawadi Phase 3 site office for customized payment schedule review.',
      type: 'SITE_VISIT',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000), // Upcoming in 2 days
      status: 'PENDING',
      meetingStatus: 'SCHEDULED',
      assignedOwner: 'Relationship Manager (Rohan)',
      callHistory: [
        {
          date: new Date(now.getTime() - 3600 * 1000 * 24).toISOString(),
          duration: '2m 25s',
          outcome: 'Qualified',
          summary: 'Arun confirmed 2 Cr budget for 4 BHK villa with garden.',
        },
      ],
    },
  });

  // 4. Completed Follow-up
  await prisma.followUp.upsert({
    where: { id: 'followup-vikram-completed' },
    update: {},
    create: {
      id: 'followup-vikram-completed',
      tenantId: tenant1.id,
      contactId: contact1.id,
      leadId: lead1.id,
      serviceId: villaService.id,
      currentStage: 'Final Decision & Booking',
      title: 'Booking Token Documentation - Vikram Malhotra',
      description: 'Cheque collected for Villa #12 token booking. Handed over draft sale agreement.',
      type: 'SALES_CALL',
      priority: 'MEDIUM',
      dueDate: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
      status: 'COMPLETED',
      meetingStatus: 'COMPLETED',
      assignedOwner: 'Sales Director',
      outcomeNotes: 'Token of Rs. 10 Lakhs received. Booking receipt generated.',
      callHistory: [
        {
          date: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
          duration: '3m 12s',
          outcome: 'Won',
          summary: 'Negotiation completed with 2% launch concession approved.',
        },
      ],
    },
  });

  // Sample Invoice
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-202611-JJ01' },
    update: {},
    create: {
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
    },
  });

  console.log('Database seeded successfully.');
  console.log('Platform Admin: admin@acrmplatform.com / Admin@123456');
  console.log('Client Admin: client@jjrealestate.in / Client@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
