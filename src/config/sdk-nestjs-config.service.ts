import { Injectable } from '@nestjs/common';
import { ErdnestConfigService } from '@multiversx/sdk-nestjs-common';
import { AppConfig } from './app.config';
import { MultiversXConfig } from './multiversx.config';

/**
 * Implementation of ErdnestConfigService to provide MultiversX SDK configuration
 */
@Injectable()
export class SdkNestjsConfigServiceImpl implements ErdnestConfigService {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly multiversXConfig: MultiversXConfig,
  ) {}

  /**
   * Get admin addresses for security endpoints
   */
  getSecurityAdmins(): string[] {
    return [];
  }

  /**
   * Get JWT secret for token signing
   */
  getJwtSecret(): string {
    return 'mx-ai-sentinel-jwt-secret';
  }

  /**
   * Get MultiversX API URL
   */
  getApiUrl(): string {
    return this.multiversXConfig.apiUrl;
  }

  /**
   * Get maximum expiry period for native auth tokens in seconds
   */
  getNativeAuthMaxExpirySeconds(): number {
    return 86400; // 24 hours
  }

  /**
   * Get accepted origins for native auth
   */
  getNativeAuthAcceptedOrigins(): string[] {
    return this.appConfig.corsOrigins;
  }
}