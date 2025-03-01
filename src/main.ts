/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { MetricsService } from './services/metrics.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Get app configuration
  const appConfig = app.get(AppConfig);

  // Set global prefix if configured
  if (appConfig.apiPrefix) {
    app.setGlobalPrefix(appConfig.apiPrefix);
  }

  // Configure CORS
  app.enableCors({
    origin: appConfig.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Set up global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Get metrics service for monitoring
  try {
    const metricsService = app.get(MetricsService);

    // Add metrics middleware
    app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const durationSeconds = (Date.now() - start) / 1000;
        metricsService.recordApiResponseTime(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          durationSeconds,
        );
      });

      next();
    });
  } catch (error) {
    logger.warn('MetricsService not available, skipping metrics middleware');
  }

  // Set up Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MultiversX AI Smart Contract Sentinel')
    .setDescription(
      'AI-powered security monitoring for MultiversX smart contracts',
    )
    .setVersion('1.0')
    .addTag('security')
    .addTag('smart-contracts')
    .addTag('alerts')
    .addTag('transactions')
    .addTag('ai-analysis')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  // Start the server
  await app.listen(appConfig.port, appConfig.host);

  const url = await app.getUrl();
  logger.log(`Server running on ${url}`);
  logger.log(`Swagger documentation available at ${url}/api-docs`);

  if (appConfig.aiAnalysisEnabled) {
    logger.log('AI Analysis: ENABLED (using Gemini API)');
  } else {
    logger.warn('AI Analysis: DISABLED (Gemini API key not set)');
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
