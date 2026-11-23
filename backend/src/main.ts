import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  // Validate Centralized Sarvam AI Environment Configuration
  const sarvamApiKey = process.env.SARVAM_API_KEY;
  if (!sarvamApiKey || sarvamApiKey.trim() === '' || sarvamApiKey === 'REPLACE_WITH_REAL_SARVAM_API_KEY') {
    logger.warn('⚠️ [Sarvam AI Provider] SARVAM_API_KEY is not set or empty in backend/.env. Client voice test sessions will require a valid centralized key.');
  } else {
    const masked = sarvamApiKey.length > 8 ? `${sarvamApiKey.substring(0, 4)}••••••••${sarvamApiKey.substring(sarvamApiKey.length - 4)}` : '••••••••';
    logger.log(`✅ [Sarvam AI Provider] Centralized Sarvam API Key validated (${masked}). Ready for multi-tenant voice sessions.`);
  }

  const port = process.env.PORT;
  if (!port) {
    throw new Error('Missing required environment configuration: PORT');
  }
  await app.listen(port);
  logger.log(`Multi-Tenant Enterprise AI CRM Backend initialized and listening on port ${port}`);
}

bootstrap();
