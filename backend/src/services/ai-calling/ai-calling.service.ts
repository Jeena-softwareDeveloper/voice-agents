import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';
import { TelephonyService } from '../../integrations/telephony/telephony.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiCallingService {
  private readonly logger = new Logger(AiCallingService.name);

  constructor(
    private prisma: PrismaService,
    private sarvamService: SarvamService,
    private telephonyService: TelephonyService,
  ) {}

  async validateEligibility(tenantId: string, leadId: string) {
    // 1. Tenant Check
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
        callingSettings: true,
        businessProfile: true,
      },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Tenant is not active or suspended.');
    }

    if (!tenant.aiCallingEnabled) {
      throw new ForbiddenException('AI Calling is disabled for this tenant.');
    }

    // 2. Calling Hours Check (Local Time)
    const currentHour = new Date().getHours();
    const startHour = tenant.callingSettings?.startHour ?? 9;
    const endHour = tenant.callingSettings?.endHour ?? 20;
    if (currentHour < startHour || currentHour >= endHour) {
      throw new BadRequestException(
        `Automated calling is only permitted between ${startHour}:00 and ${endHour}:00 (${tenant.callingSettings?.timezone || 'Asia/Kolkata'}).`,
      );
    }

    // 3. Calling Limits Check
    if (Number(tenant.usedCallingMinutes) >= tenant.monthlyCallingLimit) {
      throw new ForbiddenException('Monthly AI calling minute quota exceeded. Upgrade subscription.');
    }

    // 4. Lead Check
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      include: {
        contact: true,
        service: {
          include: {
            serviceAiConfig: true,
          },
        },
      },
    });

    if (!lead) {
      throw new BadRequestException('Lead not found.');
    }

    if (!lead.aiCallingEligible) {
      throw new BadRequestException('Lead is marked as ineligible for AI calling.');
    }

    if (!lead.contact.consentGranted) {
      throw new ForbiddenException('Customer calling consent has not been granted or was revoked.');
    }

    if (lead.callAttempts >= (tenant.callingSettings?.maxRetries ?? 3)) {
      throw new BadRequestException(`Maximum call attempts reached for this lead.`);
    }

    // 5. Approved Service AI Config Check
    if (lead.service.approvalStatus !== 'APPROVED') {
      throw new BadRequestException(
        `Service '${lead.service.name}' is pending Platform Admin approval. Calling disabled.`,
      );
    }

    if (!lead.service.serviceAiConfig || lead.service.serviceAiConfig.status !== 'APPROVED') {
      throw new BadRequestException(
        `Service '${lead.service.name}' does not have an approved AI conversation configuration.`,
      );
    }

    return { tenant, lead, aiConfig: lead.service.serviceAiConfig };
  }

  async dispatchCall(tenantId: string, leadId: string) {
    const { tenant, lead, aiConfig } = await this.validateEligibility(tenantId, leadId);

    // Create Initial Call Record
    const call = await this.prisma.call.create({
      data: {
        tenantId,
        leadId: lead.id,
        serviceId: lead.serviceId,
        serviceAiConfigId: aiConfig.id,
        recipientNumber: lead.contact.phone,
        status: 'IN_PROGRESS',
      },
    });

    const callPayload = {
      callId: call.id,
      tenantId,
      leadId: lead.id,
      phoneNumber: lead.contact.phone,
      customerName: lead.contact.fullName,
      config: {
        companyName: aiConfig.companyIdentity || tenant.name,
        serviceName: lead.service.name,
        serviceDescription: aiConfig.serviceDescription,
        openingIntro: aiConfig.openingIntro,
        qualificationQuestions: (aiConfig.qualificationQuestions as any) || [],
        approvedResponses: (aiConfig.approvedResponses as any) || {},
        objectionHandling: (aiConfig.objectionHandling as any) || {},
        closingStatement: aiConfig.closingStatement,
        language: aiConfig.language,
        voice: aiConfig.voice,
        maxDurationSeconds: aiConfig.maxDurationSeconds,
      },
    };

    // Execute through Sarvam AI service
    const callResult = this.sarvamService.simulateLiveCallExecution(callPayload);

    // Reconcile and save call result
    return this.reconcileCallResult(call.id, callResult);
  }

  async reconcileCallResult(callId: string, result: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        lead: { include: { contact: true } },
        service: true,
      },
    });

    if (!call) {
      throw new BadRequestException('Call record not found.');
    }

    // Calculate billing
    const billableMinutes = parseFloat((result.durationSeconds / 60).toFixed(2));
    const ratePerMinute = 1.5; // Platform price per minute INR
    const billedToClient = parseFloat((billableMinutes * ratePerMinute).toFixed(2));
    const providerCost = parseFloat((billableMinutes * 0.95).toFixed(2));

    const updatedCall = await this.prisma.$transaction(async (tx) => {
      // 1. Update Call Record
      const updated = await tx.call.update({
        where: { id: callId },
        data: {
          externalCallId: result.externalCallId,
          status: result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
          outcome: result.outcome,
          durationSeconds: result.durationSeconds,
          billableSeconds: result.durationSeconds,
          transcript: result.transcript,
          summary: result.summary,
          objectionHandled: result.objectionHandled,
          recordingUrl: result.recordingUrl,
          costAmount: billedToClient,
          callbackTime: result.callbackTime,
        },
      });

      // 2. Update Lead State
      let newLeadStatus = call.lead.status;
      if (result.outcome === 'QUALIFIED') newLeadStatus = 'QUALIFIED';
      else if (result.outcome === 'INTERESTED') newLeadStatus = 'INTERESTED';
      else if (result.outcome === 'NOT_INTERESTED') newLeadStatus = 'LOST';
      else if (call.lead.status === 'NEW_LEAD') newLeadStatus = 'AI_CONTACTED';

      await tx.lead.update({
        where: { id: call.leadId },
        data: {
          status: newLeadStatus,
          callAttempts: { increment: 1 },
          lastCallDate: new Date(),
          qualificationNotes: result.summary,
        },
      });

      // 3. Record Pipeline Stage Change if changed
      if (newLeadStatus !== call.lead.status) {
        await tx.salesPipelineHistory.create({
          data: {
            tenantId: call.tenantId,
            leadId: call.leadId,
            fromStatus: call.lead.status,
            toStatus: newLeadStatus,
            reason: `AI Call Completed: ${result.outcome}`,
          },
        });
      }

      // 4. Create Follow-up if callback requested or interested
      if (result.callbackTime || result.outcome === 'QUALIFIED' || result.outcome === 'INTERESTED') {
        await tx.followUp.create({
          data: {
            tenantId: call.tenantId,
            leadId: call.leadId,
            contactId: call.lead.contactId,
            title: `AI Call Follow-up: ${call.lead.contact.fullName}`,
            description: result.summary,
            type: result.callbackTime ? 'CALLBACK' : 'SALES_CALL',
            priority: result.outcome === 'QUALIFIED' ? 'HIGH' : 'MEDIUM',
            dueDate: result.callbackTime || new Date(Date.now() + 24 * 3600 * 1000),
          },
        });
      }

      // 5. Create Immutable Usage Ledger Record
      const idempotencyKey = `usage_${call.id}_${result.externalCallId}`;
      const existingLedger = await tx.aiUsageLedger.findUnique({
        where: { idempotencyKey },
      });

      if (!existingLedger && billableMinutes > 0) {
        await tx.aiUsageLedger.create({
          data: {
            tenantId: call.tenantId,
            callId: call.id,
            billableMinutes: new Prisma.Decimal(billableMinutes),
            providerCost: new Prisma.Decimal(providerCost),
            billedToClient: new Prisma.Decimal(billedToClient),
            ratePerMinute: new Prisma.Decimal(ratePerMinute),
            currency: 'INR',
            idempotencyKey,
          },
        });

        // Increment tenant total used minutes
        await tx.tenant.update({
          where: { id: call.tenantId },
          data: {
            usedCallingMinutes: { increment: billableMinutes },
          },
        });
      }

      return updated;
    });

    return updatedCall;
  }
}
