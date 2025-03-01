/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { AppConfig } from './config/app.config';
import { MultiversXConfig } from './config/multiversx.config';

@ApiTags('system')
@Controller()
export class AppController {
  getHello(): any {
    throw new Error('Method not implemented.');
  }
  constructor(
    private readonly appService: AppService,
    private readonly appConfig: AppConfig,
    private readonly multiversXConfig: MultiversXConfig,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application information' })
  @HttpCode(HttpStatus.OK)
  getInfo() {
    return this.appService.getInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application is healthy' })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'Application is not healthy' })
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    const isHealthy = await this.appService.checkHealth();
    
    if (!isHealthy) {
      return {
        status: 'error',
        message: 'One or more services are not healthy'
      };
    }
    
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: this.appConfig.environment,
      network: this.multiversXConfig.network,
      aiAnalysisEnabled: this.appConfig.aiAnalysisEnabled
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get public configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Public configuration' })
  @HttpCode(HttpStatus.OK)
  getConfig() {
    return {
      appName: this.appConfig.appName,
      environment: this.appConfig.environment,
      network: this.multiversXConfig.network,
      apiUrl: this.multiversXConfig.apiUrl,
      explorerUrl: this.multiversXConfig.explorerUrl,
      aiAnalysisEnabled: this.appConfig.aiAnalysisEnabled
    };
  }
}