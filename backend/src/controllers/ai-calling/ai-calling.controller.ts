import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { AiCallingService } from '../../services/ai-calling/ai-calling.service';
import { DispatchCallDto, BulkDispatchCallDto } from '../../dto/call.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';

@Controller('ai-calling')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AiCallingController {
  constructor(private aiCallingService: AiCallingService) {}

  @Post('dispatch')
  async dispatchSingleCall(@CurrentTenant() tenantId: string, @Body() dto: DispatchCallDto) {
    return this.aiCallingService.dispatchCall(tenantId, dto.leadId);
  }

  @Post('bulk-dispatch')
  async bulkDispatch(@CurrentTenant() tenantId: string, @Body() dto: BulkDispatchCallDto) {
    const results = [];
    for (const leadId of dto.leadIds) {
      try {
        const res = await this.aiCallingService.dispatchCall(tenantId, leadId);
        results.push({ leadId, success: true, callId: res.id });
      } catch (err: any) {
        results.push({ leadId, success: false, error: err.message });
      }
    }
    return {
      total: dto.leadIds.length,
      dispatched: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };
  }
}
