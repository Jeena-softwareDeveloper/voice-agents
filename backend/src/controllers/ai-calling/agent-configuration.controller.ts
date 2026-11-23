import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { CurrentTenant } from '../../decorators/current-tenant.decorator';
import { AgentConfigurationService } from '../../services/ai-calling/agent-configuration.service';
import { SarvamService } from '../../integrations/sarvam/sarvam.service';

@Controller('ai-calling')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AgentConfigurationController {
  constructor(
    private readonly agentConfigService: AgentConfigurationService,
    private readonly sarvamService: SarvamService,
  ) {}

  /**
   * GET /api/ai-calling/provider-capabilities
   * Returns normalized provider capabilities (languages, voices, models)
   * Safely cached, zero provider API keys returned to browser
   */
  @Get('provider-capabilities')
  async getProviderCapabilities() {
    return this.sarvamService.getProviderCapabilities();
  }

  /**
   * GET /api/ai-calling/agent-config
   * Returns current active or latest draft AI configuration with version history
   */
  @Get('agent-config')
  async getActiveConfiguration(@CurrentTenant() tenantId: string) {
    return this.agentConfigService.getActiveConfiguration(tenantId);
  }

  /**
   * POST /api/ai-calling/agent-config/generate
   * Generates a new DRAFT configuration with Gemini based on current tenant profile & offerings
   */
  @Post('agent-config/generate')
  async generateDraft(
    @CurrentTenant() tenantId: string,
    @Body() body: { guidance?: string },
  ) {
    return this.agentConfigService.generateDraftWithGemini(tenantId, body?.guidance);
  }

  /**
   * PUT /api/ai-calling/agent-config/:id
   * Allows client to edit draft instructions, questions, variables, and greeting
   */
  @Put('agent-config/:id')
  async updateConfiguration(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.agentConfigService.updateConfiguration(tenantId, id, body);
  }

  /**
   * POST /api/ai-calling/agent-config/:id/approve
   * Approves & publishes the draft configuration for active voice calling
   */
  @Post('agent-config/:id/approve')
  async approveConfiguration(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const userName = req.user?.fullName || req.user?.email || 'Administrator';
    return this.agentConfigService.approveConfiguration(tenantId, id, userName);
  }

  /**
   * GET /api/ai-calling/agent-config/history
   * Retrieves version history and approval logs
   */
  @Get('agent-config/history')
  async getVersionHistory(@CurrentTenant() tenantId: string) {
    return this.agentConfigService.getVersionHistory(tenantId);
  }
}
