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

  // Follow-up
  await prisma.followUp.upsert({
    where: { id: 'followup-arun-sitevisit' },
    update: {},
    create: {
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
