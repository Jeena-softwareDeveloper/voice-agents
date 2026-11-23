import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GeminiService } from '../../integrations/gemini/gemini.service';
import { AgentConfigurationSchema } from '../../integrations/gemini/gemini.types';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';

@Injectable()
export class AgentConfigurationService {
  private readonly logger = new Logger(AgentConfigurationService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
    private sarvamService: SarvamService,
  ) {}

  /**
   * Retrieves the active or latest configuration for the tenant.
   * If none exists yet, automatically generates an initial draft from tenant profile and services.
   */
  async getActiveConfiguration(tenantId: string) {
    // 1. Look for approved or published configuration
    let config = await (this.prisma as any).tenantAgentConfiguration.findFirst({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'PUBLISHED'] },
      },
      orderBy: { version: 'desc' },
    });

    // 2. If no approved, find latest draft
    if (!config) {
      config = await (this.prisma as any).tenantAgentConfiguration.findFirst({
        where: { tenantId },
        orderBy: { version: 'desc' },
      });
    }

    // 3. If nothing exists at all, generate initial draft using stored tenant profile
    if (!config) {
      this.logger.log(`No agent configuration found for tenant ${tenantId}. Generating initial draft with Gemini.`);
      config = await this.generateDraftWithGemini(tenantId);
    }

    // 4. Attach history summary
    const history = await this.getVersionHistory(tenantId);

    return {
      ...config,
      history,
    };
  }

  /**
   * Generates a new DRAFT configuration using Gemini based on current tenant profile & services.
   * Does NOT overwrite the existing approved configuration.
   */
  async generateDraftWithGemini(tenantId: string, customGuidance?: string) {
    // 1. Fetch organization profile
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      include: {
        businessProfile: true,
        services: { where: { isActive: true } },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found.`);
    }

    const tenantProfile = {
      name: tenant.name,
      businessName: tenant.businessProfile?.businessName || tenant.name,
      category: tenant.businessProfile?.category || tenant.businessType,
      description: tenant.businessProfile?.description || '',
      operatingLocations: tenant.businessProfile?.operatingLocations || `${tenant.city}, ${tenant.state}`,
      website: tenant.businessProfile?.website || '',
      phone: tenant.phone || '',
      primaryObjective: tenant.businessProfile?.primaryObjective || '',
    };

    const services = tenant.services || [];

    // 2. Fetch existing knowledge or FAQs from services
    const knowledgeItems: any[] = [];
    const serviceAiConfigs = await (this.prisma as any).serviceAiConfig.findMany({
      where: { tenantId },
    });
    serviceAiConfigs.forEach((sc: any) => {
      if (Array.isArray(sc.knowledgeBase)) {
        sc.knowledgeBase.forEach((kb: any) => knowledgeItems.push(kb));
      }
    });

    // 3. Generate structured schema with Gemini
    const generated: AgentConfigurationSchema = await this.geminiService.generateAgentConfiguration(
      tenantProfile,
      services,
      knowledgeItems,
      customGuidance,
    );

    // 4. Retrieve provider capabilities for normalized defaults
    const caps = await this.sarvamService.getProviderCapabilities();
    const effectiveSpeakingStyle = {
      ...(generated.speakingStyle || {}),
      language: (generated.speakingStyle as any)?.language || caps.defaultSettings.languageId,
      speaker: (generated.speakingStyle as any)?.speaker || caps.defaultSettings.voiceId,
      model: (generated.speakingStyle as any)?.model || caps.defaultSettings.modelId,
    };

    // 5. Determine next version number
    const existingConfigs = await (this.prisma as any).tenantAgentConfiguration.findMany({
      where: { tenantId },
      orderBy: { version: 'desc' },
      take: 1,
    });
    const nextVersion = existingConfigs.length > 0 ? existingConfigs[0].version + 1 : 1;

    // 6. Create new DRAFT record in database
    const newConfig = await (this.prisma as any).tenantAgentConfiguration.create({
      data: {
        tenantId,
        version: nextVersion,
        sourceProfileVersion: 1,
        status: 'DRAFT',
        agentName: generated.agentName,
        agentRole: generated.agentRole,
        organizationContext: generated.organizationContext,
        channel: generated.channel,
        conversationObjectives: generated.conversationObjectives,
        openingGreeting: generated.openingGreeting,
        qualificationQuestions: generated.qualificationQuestions,
        requiredInfo: generated.requiredInfo,
        faqs: generated.faqs,
        objectionHandling: generated.objectionHandling,
        speakingStyle: effectiveSpeakingStyle,
        followUpRules: generated.followUpRules,
        humanEscalationRules: generated.humanEscalationRules,
        variables: generated.variables,
        outputFields: generated.outputFields,
        prohibitedClaims: generated.prohibitedClaims,
        missingInformation: generated.missingInformation,
        fullPrompt: generated.fullPrompt,
        isOutdated: false,
        outdatedReason: null,
        generatedAt: new Date(),
      },
    });

    this.logger.log(`Created new DRAFT Agent Configuration v${nextVersion} for tenant ${tenantId}.`);
    return newConfig;
  }

  /**
   * Updates an existing draft configuration with client edits.
   * If the current target is an APPROVED configuration, creates a new DRAFT version
   * rather than mutating the active production configuration.
   */
  async updateConfiguration(tenantId: string, configId: string, updateDto: Partial<AgentConfigurationSchema>) {
    const config = await (this.prisma as any).tenantAgentConfiguration.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(`Configuration ${configId} not found.`);
    }

    if (config.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have permission to modify this configuration.');
    }

    // Validate provider capabilities if speakingStyle is being updated
    if (updateDto.speakingStyle) {
      const { language, speaker, model } = updateDto.speakingStyle as any;
      await this.sarvamService.validateCapabilitySelection(language, speaker, model);
    }

    // Never save a draft over the currently approved configuration
    if (config.status === 'APPROVED' || config.status === 'PUBLISHED') {
      const existingConfigs = await (this.prisma as any).tenantAgentConfiguration.findMany({
        where: { tenantId },
        orderBy: { version: 'desc' },
        take: 1,
      });
      const nextVersion = existingConfigs.length > 0 ? existingConfigs[0].version + 1 : config.version + 1;

      const newDraft = await (this.prisma as any).tenantAgentConfiguration.create({
        data: {
          tenantId,
          version: nextVersion,
          sourceProfileVersion: config.sourceProfileVersion || 1,
          status: 'DRAFT',
          agentName: updateDto.agentName || config.agentName,
          agentRole: updateDto.agentRole || config.agentRole,
          organizationContext: config.organizationContext,
          channel: config.channel,
          conversationObjectives: updateDto.conversationObjectives || config.conversationObjectives,
          openingGreeting: updateDto.openingGreeting || config.openingGreeting,
          qualificationQuestions: updateDto.qualificationQuestions || config.qualificationQuestions,
          requiredInfo: config.requiredInfo,
          faqs: config.faqs,
          objectionHandling: updateDto.objectionHandling || config.objectionHandling,
          speakingStyle: updateDto.speakingStyle || config.speakingStyle,
          followUpRules: config.followUpRules,
          humanEscalationRules: config.humanEscalationRules,
          variables: updateDto.variables || config.variables,
          outputFields: config.outputFields,
          prohibitedClaims: config.prohibitedClaims,
          missingInformation: config.missingInformation,
          fullPrompt: updateDto.fullPrompt || config.fullPrompt,
          isOutdated: false,
          outdatedReason: null,
          generatedAt: new Date(),
        },
      });

      this.logger.log(`Forked approved v${config.version} into new editable DRAFT v${nextVersion} for tenant ${tenantId}.`);
      return newDraft;
    }

    const updated = await (this.prisma as any).tenantAgentConfiguration.update({
      where: { id: configId },
      data: {
        ...(updateDto.agentName && { agentName: updateDto.agentName }),
        ...(updateDto.agentRole && { agentRole: updateDto.agentRole }),
        ...(updateDto.openingGreeting && { openingGreeting: updateDto.openingGreeting }),
        ...(updateDto.conversationObjectives && { conversationObjectives: updateDto.conversationObjectives }),
        ...(updateDto.qualificationQuestions && { qualificationQuestions: updateDto.qualificationQuestions }),
        ...(updateDto.variables && { variables: updateDto.variables }),
        ...(updateDto.speakingStyle && { speakingStyle: updateDto.speakingStyle }),
        ...(updateDto.objectionHandling && { objectionHandling: updateDto.objectionHandling }),
        ...(updateDto.fullPrompt && { fullPrompt: updateDto.fullPrompt }),
        isOutdated: false,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Approves and publishes a draft configuration, archiving previous approved versions.
   */
  async approveConfiguration(tenantId: string, configId: string, userId: string = 'User') {
    const config = await (this.prisma as any).tenantAgentConfiguration.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(`Configuration ${configId} not found.`);
    }

    if (config.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied.');
    }

    // 1. Archive any existing approved configurations for this tenant
    const existingApproved = await (this.prisma as any).tenantAgentConfiguration.findMany({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'PUBLISHED'] },
      },
    });

    for (const prev of existingApproved) {
      if (prev.id !== configId) {
        await (this.prisma as any).tenantAgentConfiguration.update({
          where: { id: prev.id },
          data: { status: 'ARCHIVED' },
        });
      }
    }

    // 2. Mark target as APPROVED
    const approved = await (this.prisma as any).tenantAgentConfiguration.update({
      where: { id: configId },
      data: {
        status: 'APPROVED',
        isOutdated: false,
        outdatedReason: null,
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    // 3. Create audit record in version history
    try {
      await (this.prisma as any).agentConfigurationVersion.create({
        data: {
          configurationId: config.id,
          tenantId,
          versionNumber: config.version,
          status: 'APPROVED',
          snapshot: approved,
          changeNotes: `Approved and published v${config.version} by ${userId}`,
          createdById: userId,
        },
      });
    } catch {}

    this.logger.log(`Approved & Published Agent Configuration v${config.version} for tenant ${tenantId}.`);
    return approved;
  }

  /**
   * Marks existing configurations as outdated when company profile or services are edited
   */
  async markOutdated(tenantId: string, reason: string) {
    const configs = await (this.prisma as any).tenantAgentConfiguration.findMany({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'PUBLISHED'] },
      },
    });

    for (const cfg of configs) {
      await (this.prisma as any).tenantAgentConfiguration.update({
        where: { id: cfg.id },
        data: {
          isOutdated: true,
          outdatedReason: reason,
        },
      });
    }

    this.logger.log(`Flagged agent configurations for tenant ${tenantId} as outdated: ${reason}`);
  }

  /**
   * Returns complete version history for tenant
   */
  async getVersionHistory(tenantId: string) {
    const configs = await (this.prisma as any).tenantAgentConfiguration.findMany({
      where: { tenantId },
      orderBy: { version: 'desc' },
    });

    return configs.map((c: any) => ({
      id: c.id,
      version: c.version,
      status: c.status,
      agentName: c.agentName,
      agentRole: c.agentRole,
      generatedAt: c.generatedAt,
      approvedAt: c.approvedAt,
      approvedBy: c.approvedBy,
      isOutdated: c.isOutdated,
      outdatedReason: c.outdatedReason,
    }));
  }
}
