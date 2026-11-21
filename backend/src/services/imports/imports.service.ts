import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as xlsx from 'xlsx';

export interface ImportParsedRow {
  rowNumber: number;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  serviceCategory?: string;
  notes?: string;
  isValid: boolean;
  errorMessage?: string;
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private prisma: PrismaService) {}

  async processLeadImport(
    tenantId: string,
    fileBuffer: Buffer,
    fileName: string,
    selectedServiceId?: string,
  ) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new BadRequestException('Uploaded file contains no data rows.');
    }

    // Retrieve active tenant services to map rows
    const tenantServices = await this.prisma.service.findMany({
      where: { tenantId, isActive: true },
    });

    const serviceMapByName = new Map<string, string>();
    tenantServices.forEach((s) => {
      serviceMapByName.set(s.name.toLowerCase().trim(), s.id);
      serviceMapByName.set(s.category.toLowerCase().trim(), s.id);
    });

    let selectedService = null;
    if (selectedServiceId) {
      selectedService = tenantServices.find((s) => s.id === selectedServiceId);
      if (!selectedService) {
        throw new BadRequestException('Selected service not found or not active.');
      }
    }

    // Create Import Batch
    const batch = await this.prisma.leadImportBatch.create({
      data: {
        tenantId,
        serviceId: selectedServiceId,
        fileName,
        totalRows: rawRows.length,
        status: 'PROCESSING',
      },
    });

    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = i + 2; // Accounting for 1-based index and header

      // Identify column keys flexibly
      const nameKey = Object.keys(row).find((k) => /name|full_name|lead_name|customer/i.test(k));
      const phoneKey = Object.keys(row).find((k) => /phone|mobile|contact|tel/i.test(k));
      const emailKey = Object.keys(row).find((k) => /email|mail/i.test(k));
      const locKey = Object.keys(row).find((k) => /location|city|address/i.test(k));
      const serviceKey = Object.keys(row).find((k) => /service|category|product/i.test(k));

      const rawName = nameKey ? String(row[nameKey]).trim() : '';
      const rawPhone = phoneKey ? String(row[phoneKey]).trim().replace(/[^0-9+]/g, '') : '';
      const rawEmail = emailKey ? String(row[emailKey]).trim() : '';
      const rawLoc = locKey ? String(row[locKey]).trim() : '';
      const rawService = serviceKey ? String(row[serviceKey]).trim() : '';

      let targetServiceId = selectedService?.id;

      let errorMessage: string | null = null;
      let validationStatus: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';

      // Validation 1: Phone number required and at least 10 digits
      if (!rawPhone || rawPhone.length < 10) {
        validationStatus = 'INVALID';
        errorMessage = 'Invalid or missing phone number (minimum 10 digits required).';
      }

      // Validation 2: Lead Name required
      if (!rawName) {
        validationStatus = 'INVALID';
        errorMessage = errorMessage ? `${errorMessage} Missing lead name.` : 'Missing lead name.';
      }

      // Validation 3: Multi-service mapping if single service was not preselected
      if (!targetServiceId) {
        if (!rawService) {
          validationStatus = 'INVALID';
          errorMessage = errorMessage
            ? `${errorMessage} No service category specified.`
            : 'No service category specified in row.';
        } else {
          const matched = serviceMapByName.get(rawService.toLowerCase().trim());
          if (!matched) {
            validationStatus = 'INVALID';
            errorMessage = `Service '${rawService}' does not match any active service for this company.`;
          } else {
            targetServiceId = matched;
          }
        }
      }

      let createdLeadId: string | null = null;

      if (validationStatus === 'VALID' && targetServiceId) {
        try {
          // Contact Single Source of Truth
          let contact = await this.prisma.contact.findUnique({
            where: {
              tenantId_phone: {
                tenantId,
                phone: rawPhone,
              },
            },
          });

          if (!contact) {
            contact = await this.prisma.contact.create({
              data: {
                tenantId,
                fullName: rawName,
                phone: rawPhone,
                email: rawEmail || null,
                location: rawLoc || null,
                consentGranted: true,
                consentSource: `Batch Import: ${fileName}`,
              },
            });
          }

          // Check for duplicate lead under this service
          const existingLead = await this.prisma.lead.findFirst({
            where: {
              tenantId,
              contactId: contact.id,
              serviceId: targetServiceId,
            },
          });

          if (existingLead) {
            validationStatus = 'DUPLICATE';
            errorMessage = 'Duplicate lead: Contact already has an enquiry under this service.';
            invalidCount++;
          } else {
            const lead = await this.prisma.lead.create({
              data: {
                tenantId,
                contactId: contact.id,
                serviceId: targetServiceId,
                leadSource: `Import: ${fileName}`,
                status: 'NEW_LEAD',
                interestLevel: 'MEDIUM',
                aiCallingEligible: true,
              },
            });
            createdLeadId = lead.id;
            validCount++;
          }
        } catch (err: any) {
          validationStatus = 'INVALID';
          errorMessage = err.message || 'Database error processing row.';
          invalidCount++;
        }
      } else {
        invalidCount++;
      }

      // Record import row
      await this.prisma.leadImportRow.create({
        data: {
          batchId: batch.id,
          tenantId,
          rowNumber,
          rawData: row,
          parsedName: rawName,
          parsedPhone: rawPhone,
          parsedService: rawService || selectedService?.name,
          validationStatus,
          errorMessage,
          leadId: createdLeadId,
        },
      });
    }

    // Update batch status
    await this.prisma.leadImportBatch.update({
      where: { id: batch.id },
      data: {
        validRows: validCount,
        invalidRows: invalidCount,
        status: 'COMPLETED',
      },
    });

    return {
      batchId: batch.id,
      fileName,
      totalRows: rawRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
    };
  }

  async getImportBatches(tenantId: string) {
    return this.prisma.leadImportBatch.findMany({
      where: { tenantId },
      include: {
        rows: {
          take: 50,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
