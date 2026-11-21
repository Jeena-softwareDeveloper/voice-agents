import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendInvitationEmail(to: string, invitationLink: string, companyName: string): Promise<boolean> {
    this.logger.log(`[Email Service] Sending Tenant Invitation to: ${to}`);
    this.logger.log(`[Email Service] Company: ${companyName}`);
    this.logger.log(`[Email Service] Activation Link: ${invitationLink}`);
    return true;
  }

  async sendPaymentReminder(to: string, invoiceNumber: string, amountDue: number): Promise<boolean> {
    this.logger.log(`[Email Service] Sending Payment Reminder for ${invoiceNumber} (Amount: INR ${amountDue}) to: ${to}`);
    return true;
  }
}
