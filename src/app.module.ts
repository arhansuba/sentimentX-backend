/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ERDNEST_CONFIG_SERVICE } from '@multiversx/sdk-nestjs-common';
import { MetricsModule } from './metrics.module'; // Ensure correct import path

// Import controllers
import { AppController } from './app.controller';
import { ContractController } from './controllers/contract.controller';
import { AlertController } from './controllers/alert.controller';
import { TransactionController } from './controllers/transaction.controller';
import { MetricsController } from './controllers/metrics.controller';
import { AiAnalysisController } from './controllers/ai-analysis.controller';

// Import services
import { AppService } from './app.service';
import { BlockchainService } from './services/blockchain.service';
import { AlertService } from './services/alert.service';
import { TransactionService } from './services/transaction.service';
import { ContractService } from './services/contract.service';
import { CacheService } from './services/cache.service';
//import { MetricsService } from '@multiversx/sdk-nestjs-monitoring';

// Import AI components
import { SecurityDetector } from './ai/detector';
import { GeminiService } from './ai/gemini-service';
import { ReentrancyDetector } from './ai/detectors/reentrancy.detector';
import { FlashLoanDetector } from './ai/detectors/flashloan.detector';
import { OverflowDetector } from './ai/detectors/overflow.detector';
import { AccessControlDetector } from './ai/detectors/access-control.detector';

// Import configuration
import { AppConfig } from './config/app.config';
import { MultiversXConfig } from './config/multiversx.config';
import { SdkNestjsConfigServiceImpl } from './config/sdk-nestjs-config.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Monitoring
    MetricsModule.forRoot({
      defaultLabels: {
        application: 'mx-ai-smart-contract-sentinel',
      },
    }),
  ],
  controllers: [
    AppController,
    ContractController,
    AlertController,
    TransactionController,
    MetricsController,
    AiAnalysisController,
  ],
  providers: [
    // Application services
    AppService,
    AppConfig,
    MultiversXConfig,
    
    // MultiversX SDK configuration
    {
      provide: ERDNEST_CONFIG_SERVICE,
      useClass: SdkNestjsConfigServiceImpl,
    },
    
    // Core services
    BlockchainService,
    AlertService,
    TransactionService,
    ContractService,
    CacheService,
    
    // AI components
    SecurityDetector,
    GeminiService,
    ReentrancyDetector,
    FlashLoanDetector,
    OverflowDetector,
    AccessControlDetector,
  ],
})
export class AppModule {}