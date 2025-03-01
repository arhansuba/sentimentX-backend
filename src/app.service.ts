/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from './config/app.config';
import { MultiversXConfig } from './config/multiversx.config';
import { GeminiService } from './ai/gemini-service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly appConfig: AppConfig,
    private readonly multiversXConfig: MultiversXConfig,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Get application information
   * @returns Application info object
   */
  getInfo() {
    return {
      name: this.appConfig.appName,
      description:
        'AI-powered security monitoring for MultiversX smart contracts',
      version: '1.0.0',
      environment: this.appConfig.environment,
      network: this.multiversXConfig.network,
      features: {
        aiAnalysis: this.appConfig.aiAnalysisEnabled,
        patternDetection: true,
        anomalyDetection: true,
        realTimeMonitoring: true,
      },
    };
  }

  /**
   * Check if the application is healthy
   * @returns True if all services are healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Check MultiversX API availability
      const mxApiHealthy = await this.checkMultiversXApiHealth();

      // Check Gemini API availability if enabled
      const geminiHealthy =
        !this.appConfig.aiAnalysisEnabled ||
        (await this.checkGeminiApiHealth());

      return mxApiHealthy && geminiHealthy;
    } catch (error: any) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check MultiversX API health
   * @returns True if MultiversX API is available
   */
  private async checkMultiversXApiHealth(): Promise<boolean> {
    try {
      const provider = this.multiversXConfig.getProxyProvider();
      const config = await provider.getNetworkConfig();

      return !!config && !!config.ChainID;
    } catch (error: any) {
      this.logger.error(`MultiversX API health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check Gemini API health
   * @returns True if Gemini API is available
   */
  private async checkGeminiApiHealth(): Promise<boolean> {
    if (!this.appConfig.geminiApiKey) {
      return false;
    }

    try {
      // Simple test analysis to verify API is working
      const testPrompt = 'Is this a working connection?';
       
      const result: any = await this.geminiService['model'].generateContent(testPrompt);

      return !!result && !!result.response;
    } catch (error: any) {
      this.logger.error(`Gemini API health check failed: ${error.message}`);
      return false;
    }
  }
}