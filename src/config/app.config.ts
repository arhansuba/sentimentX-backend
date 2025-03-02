import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from './environment.type';
import { SafetySetting } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration service
 *
 * Provides centralized access to configuration values
 */
@Injectable()
export class AppConfig {
  safetySettings: SafetySetting[] | undefined;
  generationConfig: { temperature: number; topK: number; topP: number; maxOutputTokens: number; };
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get the application name
   */
  public get appName(): string {
    return this.configService.get<string>(
      'APP_NAME',
      'MultiversX AI Smart Contract Sentinel',
    );
  }

  /**
   * Get the current environment
   */
  public get environment(): Environment {
    const env = this.configService.get<string>('NODE_ENV', 'development');

    switch (env) {
      case 'production':
        return Environment.PRODUCTION;
      case 'staging':
        return Environment.STAGING;
      default:
        return Environment.DEVELOPMENT;
    }
  }

  /**
   * Check if running in production
   */
  public get isProduction(): boolean {
    return this.environment === Environment.PRODUCTION;
  }

  /**
   * Check if running in development
   */
  public get isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT;
  }

  /**
   * Get the server port
   */
  public get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  /**
   * Get the server host
   */
  public get host(): string {
    return this.configService.get<string>('HOST', '0.0.0.0');
  }

  /**
   * Get the API prefix
   */
  public get apiPrefix(): string {
    return this.configService.get<string>('API_PREFIX', '');
  }

  /**
   * Get the allowed origins for CORS
   */
  public get corsOrigins(): string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS', '*');

    if (origins === '*') {
      return ['*'];
    }

    return origins.split(',').map((origin) => origin.trim());
  }

  /**
   * Get the log level
   */
  public get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'info');
  }

  /**
   * Get the Gemini API key
   */
  public get geminiApiKey(): string {
    return process.env.GEMINI_API_KEY || this.configService.get<string>('GEMINI_API_KEY', '');
  }

  /**
   * Check if AI analysis is enabled
   */
  public get aiAnalysisEnabled(): boolean {
    if (!this.geminiApiKey) {
      return false;
    }

    return this.configService.get<boolean>('AI_ANALYSIS_ENABLED', true);
  }

  /**
   * Get the Gemini model name
   */
  public get geminiModel(): string {
    return this.configService.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');
  }

  /**
   * Get cache TTL in seconds
   */
  public get cacheTtl(): number {
    return this.configService.get<number>('CACHE_TTL', 300);
  }

  /**
   * Get maximum number of items to cache
   */
  public get cacheMax(): number {
    return this.configService.get<number>('CACHE_MAX', 1000);
  }

  /**
   * Get default pagination limit
   */
  public get defaultLimit(): number {
    return this.configService.get<number>('DEFAULT_LIMIT', 20);
  }

  /**
   * Get maximum pagination limit
   */
  public get maxLimit(): number {
    return this.configService.get<number>('MAX_LIMIT', 100);
  }

  /**
   * Get frontend URL for CORS
   */
  public get frontendUrl(): string {
    return this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
  }
}
