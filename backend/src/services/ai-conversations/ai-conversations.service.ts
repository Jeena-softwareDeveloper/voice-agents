import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';
import { CreateAiConversationTemplateDto, ConfigureServiceAiConfigDto } from '../../dto/ai-conversation.dto';

@Injectable()
export class AiConversationsService {
  constructor(
    private prisma: PrismaService,
    private sarvamService: SarvamService,
  ) {}

  async getTemplates() {
    return this.prisma.aiConversationTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(dto: CreateAiConversationTemplateDto) {
    return this.prisma.aiConversationTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        industry: dto.industry,
        openingIntro: dto.openingIntro,
        instructions: dto.instructions,
        qualificationQuestions: dto.qualificationQuestions,
        approvedResponses: dto.approvedResponses,
        objectionHandling: dto.objectionHandling,
        closingStatement: dto.closingStatement,
        defaultLanguage: dto.defaultLanguage || 'hi-IN',
        defaultVoice: dto.defaultVoice || 'meera',
        version: 1,
      },
    });
  }

  async configureAndApproveServiceAi(dto: ConfigureServiceAiConfigDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { tenant: true },
    });

    if (!service) {
      throw new NotFoundException('Service category not found.');
    }

    const config = await this.prisma.serviceAiConfig.upsert({
      where: { serviceId: dto.serviceId },
      create: {
        tenantId: service.tenantId,
        serviceId: service.id,
        templateId: dto.templateId,
        openingIntro: dto.openingIntro,
        companyIdentity: dto.companyIdentity,
        serviceDescription: dto.serviceDescription,
        instructions: dto.instructions,
        qualificationQuestions: dto.qualificationQuestions,
        approvedResponses: dto.approvedResponses,
        objectionHandling: dto.objectionHandling,
        language: dto.language,
        voice: dto.voice,
        maxDurationSeconds: dto.maxDurationSeconds || 300,
        closingStatement: dto.closingStatement,
        escalationPolicy: dto.escalationPolicy,
        status: dto.status || 'APPROVED',
        version: 1,
      },
      update: {
        openingIntro: dto.openingIntro,
        companyIdentity: dto.companyIdentity,
        serviceDescription: dto.serviceDescription,
        instructions: dto.instructions,
        qualificationQuestions: dto.qualificationQuestions,
        approvedResponses: dto.approvedResponses,
        objectionHandling: dto.objectionHandling,
        language: dto.language,
        voice: dto.voice,
        maxDurationSeconds: dto.maxDurationSeconds || 300,
        closingStatement: dto.closingStatement,
        escalationPolicy: dto.escalationPolicy,
        status: dto.status || 'APPROVED',
        version: { increment: 1 },
      },
    });

    // Mark the service as APPROVED
    await this.prisma.service.update({
      where: { id: service.id },
      data: { approvalStatus: 'APPROVED' },
    });

    return config;
  }

  async testConversation(serviceAiConfigId: string) {
    const config = await this.prisma.serviceAiConfig.findUnique({
      where: { id: serviceAiConfigId },
      include: { service: true, tenant: true },
    });

    if (!config) {
      throw new NotFoundException('Service AI configuration not found.');
    }

    const testPayload = {
      callId: 'test_call',
      tenantId: config.tenantId,
      leadId: 'test_lead',
      phoneNumber: '+919999999999',
      customerName: 'Test Prospect',
      config: {
        companyName: config.companyIdentity,
        serviceName: config.service.name,
        serviceDescription: config.serviceDescription,
        openingIntro: config.openingIntro,
        qualificationQuestions: (config.qualificationQuestions as any) || [],
        approvedResponses: (config.approvedResponses as any) || {},
        objectionHandling: (config.objectionHandling as any) || {},
        closingStatement: config.closingStatement,
        language: config.language,
        voice: config.voice,
        maxDurationSeconds: config.maxDurationSeconds,
      },
    };

    const simulatedResult = this.sarvamService.simulateLiveCallExecution(testPayload);

    return {
      success: true,
      serviceName: config.service.name,
      testTranscript: simulatedResult.transcript,
      simulatedOutcome: simulatedResult.outcome,
      durationSeconds: simulatedResult.durationSeconds,
    };
  }

  getVoiceAndLanguageOptions() {
    return {
      languages: this.sarvamService.getAvailableLanguages(),
      voices: this.sarvamService.getAvailableVoices(),
    };
  }
}
