/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ERDNEST_CONFIG_SERVICE } from '@multiversx/sdk-nestjs-common';
import { MetricsModule } from './metrics.module'; // Ensure correct import path
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertModule } from './alert/alert.module';
import { ContractModule } from './contract/contract.module';

// Import controllers
import { AppController } from './app.controller';
import { ContractController } from './controllers/contract.controller';
import { AlertController } from './controllers/alert.controller';
import { TransactionController } from './controllers/transaction.controller';
import { MetricsController } from './controllers/metrics.controller';
import { AiAnalysisController } from './controllers/ai-analysis.controller';
import { DashboardController } from './dashboard/dashboard.controller';

// Import services
import { AppService } from './app.service';
import { BlockchainService } from './services/blockchain.service';
import { AlertService } from './services/alert.service';
import { TransactionService } from './services/transaction.service';
import { ContractService } from './services/contract.service';
import { CacheService } from './services/cache.service';
import { MetricsService } from './services/metrics.service';
import { GitHubService } from './services/github.service';
import { DashboardService } from './dashboard/dashboard.service';

// Import AI components
import { SecurityDetector } from './ai/detector';
import { GeminiService } from './ai/gemini-service';
import { ReentrancyDetector } from './ai/detectors/reentrancy.detector';
import { FlashLoanDetector } from './ai/detectors/flashloan.detector';
import { OverflowDetector } from './ai/detectors/overflow.detector';
import { AccessControlDetector } from './ai/detectors/access-control.detector';
import { SecurityScoring } from './ai/scoring';

// Import configuration
import { AppConfig } from './config/app.config';
import { MultiversXConfig } from './config/multiversx.config';
import { SdkNestjsConfigServiceImpl } from './config/sdk-nestjs-config.service';

// Import entities
import { Contract } from './entities/contract.entity';
import { Alert } from './entities/alert.entity';
import { Transaction } from '@multiversx/sdk-core/out/transaction';

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
    AlertModule,
    ContractModule,
  ],
  controllers: [
    AppController,
    ContractController,
    AlertController,
    TransactionController,
    MetricsController,
    AiAnalysisController,
    DashboardController,
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
    MetricsService,
    SecurityScoring,
    GitHubService,
    DashboardService,
  ],
  exports: [CacheService], // If used across modules
})
export class AppModule {}