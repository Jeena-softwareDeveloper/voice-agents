import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { DatabaseModule } from './database/database.module';
import { TenantValidator } from './tenancy/tenant-validator';
import { TenantResolverMiddleware } from './tenancy/tenant-resolver';
import { JwtStrategy } from './services/auth/jwt.strategy';

// Integrations
import { SarvamService } from './integrations/sarvam/sarvam.service';
import { TelephonyService } from './integrations/telephony/telephony.service';
import { EmailService } from './integrations/email/email.service';
import { PaymentGatewayService } from './integrations/payments/payment-gateway.service';
import { GeminiService } from './integrations/gemini/gemini.service';

// Services
import { AuthService } from './services/auth/auth.service';
import { TenantsService } from './services/tenants/tenants.service';
import { BusinessOnboardingService } from './services/business-onboarding/business-onboarding.service';
import { ServicesService } from './services/services/services.service';
import { AiConversationsService } from './services/ai-conversations/ai-conversations.service';
import { LeadsService } from './services/leads/leads.service';
import { ImportsService } from './services/imports/imports.service';
import { AiCallingService } from './services/ai-calling/ai-calling.service';
import { AgentConfigurationService } from './services/ai-calling/agent-configuration.service';
import { SarvamAgentSocketService } from './services/ai-calling/sarvam-agent-socket.service';
import { CallsService } from './services/calls/calls.service';
import { SalesPipelineService } from './services/sales-pipeline/sales-pipeline.service';
import { FollowUpsService } from './services/follow-ups/follow-ups.service';
import { CustomersService } from './services/customers/customers.service';
import { ReportsService } from './services/reports/reports.service';
import { PaymentsService } from './services/payments/payments.service';
import { SettingsService } from './services/settings/settings.service';

// Controllers
import { AuthController } from './controllers/auth/auth.controller';
import { TenantsController } from './controllers/tenants/tenants.controller';
import { PlatformAdminController } from './controllers/platform-admin/platform-admin.controller';
import { BusinessOnboardingController } from './controllers/business-onboarding/business-onboarding.controller';
import { ServicesController } from './controllers/services/services.controller';
import { LeadsController } from './controllers/leads/leads.controller';
import { ImportsController } from './controllers/imports/imports.controller';
import { AiCallingController } from './controllers/ai-calling/ai-calling.controller';
import { AgentConfigurationController } from './controllers/ai-calling/agent-configuration.controller';
import { SarvamRuntimeController } from './controllers/ai-calling/sarvam-runtime.controller';
import { CallsController } from './controllers/calls/calls.controller';
import { SalesPipelineController } from './controllers/sales-pipeline/sales-pipeline.controller';
import { FollowUpsController } from './controllers/follow-ups/follow-ups.controller';
import { CustomersController } from './controllers/customers/customers.controller';
import { ReportsController } from './controllers/reports/reports.controller';
import { PaymentsController } from './controllers/payments/payments.controller';
import { SettingsController } from './controllers/settings/settings.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'super-secret-acrm-jwt-key-change-in-production-2026'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    DatabaseModule,
  ],
  controllers: [
    AuthController,
    TenantsController,
    PlatformAdminController,
    BusinessOnboardingController,
    ServicesController,
    LeadsController,
    ImportsController,
    AiCallingController,
    AgentConfigurationController,
    SarvamRuntimeController,
    CallsController,
    SalesPipelineController,
    FollowUpsController,
    CustomersController,
    ReportsController,
    PaymentsController,
    SettingsController,
  ],
  providers: [
    TenantValidator,
    JwtStrategy,
    SarvamService,
    TelephonyService,
    EmailService,
    PaymentGatewayService,
    GeminiService,
    AuthService,
    TenantsService,
    BusinessOnboardingService,
    ServicesService,
    AiConversationsService,
    LeadsService,
    ImportsService,
    AiCallingService,
    AgentConfigurationService,
    SarvamAgentSocketService,
    CallsService,
    SalesPipelineService,
    FollowUpsService,
    CustomersService,
    ReportsService,
    PaymentsService,
    SettingsService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolverMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
