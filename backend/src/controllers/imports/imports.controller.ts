import { Controller, Post, Get, Body, UploadedFile, UseInterceptors, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from '../../services/imports/imports.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('imports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ImportsController {
  constructor(private importsService: ImportsService) {}

  @Post('leads')
  @UseInterceptors(FileInterceptor('file'))
  async importLeads(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('serviceId') serviceId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide an Excel or CSV file.');
    }
    return this.importsService.processLeadImport(tenantId, file.buffer, file.originalname, serviceId);
  }

  @Get('batches')
  async getImportBatches(@CurrentTenant() tenantId: string) {
    return this.importsService.getImportBatches(tenantId);
  }
}
