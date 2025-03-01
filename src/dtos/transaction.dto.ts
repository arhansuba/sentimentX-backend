import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { RiskLevel } from './alert.dto';

export class AnalyzeTransactionDto {
  @ApiProperty({ description: 'Transaction hash to analyze', example: '5ba91d5c2b7fbe1f1d2442c13fc07f354e8b43d8f1200dfeea9bae45dd8ce4e8' })
  @IsString()
  @IsNotEmpty()
  transactionHash: string;
}

export class TransactionAnalysisDto {
  @ApiProperty({ description: 'Transaction hash', example: '5ba91d5c2b7fbe1f1d2442c13fc07f354e8b43d8f1200dfeea9bae45dd8ce4e8' })
  hash: string;

  @ApiProperty({ description: 'Sender address', example: 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th' })
  sender: string;

  @ApiProperty({ description: 'Receiver address', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  receiver: string;

  @ApiProperty({ description: 'Transaction value in smallest denomination', example: '1000000000000000000' })
  value: string;

  @ApiProperty({ description: 'Timestamp of analysis' })
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Whether the transaction has been analyzed', example: true })
  @IsBoolean()
  isAnalyzed: boolean;

  @ApiProperty({ description: 'Security score (0-100)', example: 65 })
  securityScore: number;

  @ApiProperty({ description: 'Risk level based on security score', example: 'medium', enum: Object.values(RiskLevel) })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'List of detected vulnerabilities', example: ['reentrancy', 'access-control'] })
  @IsArray()
  vulnerabilities: string[];

  @ApiProperty({ description: 'Whether the transaction shows anomalous patterns', example: false })
  @IsBoolean()
  isAnomaly: boolean;

  @ApiPropertyOptional({ description: 'Function name being called', example: 'swap_tokens' })
  @IsString()
  @IsOptional()
  functionName?: string;

  @ApiPropertyOptional({ description: 'Gas used by the transaction', example: '50000' })
  @IsString()
  @IsOptional()
  gasUsed?: string;
}

export class TransactionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by contract address', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  @IsOptional()
  contractAddress?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum security score', example: 50 })
  @IsNumber()
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum number of transactions to return', example: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by anomaly status', example: true })
  @IsBoolean()
  @IsOptional()
  isAnomaly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by function name', example: 'swap_tokens' })
  @IsString()
  @IsOptional()
  functionName?: string;
}

export class TransactionStatisticsDto {
  @ApiProperty({ description: 'Total number of analyzed transactions', example: 1254 })
  totalTransactions: number;

  @ApiProperty({ description: 'Number of transactions with security issues', example: 87 })
  transactionsWithIssues: number;

  @ApiProperty({ description: 'Number of high-risk transactions', example: 23 })
  highRiskTransactions: number;

  @ApiProperty({ description: 'Number of anomalous transactions', example: 15 })
  anomalousTransactions: number;

  @ApiProperty({ description: 'Average security score across all transactions', example: 82.5 })
  averageSecurityScore: number;

  @ApiProperty({ description: 'Distribution of transactions by risk level',
    example: {
      critical: 5,
      high: 18,
      medium: 64,
      low: 120,
      none: 1047
    }
  })
  riskLevelDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };

  @ApiProperty({ description: 'Most common vulnerability types found',
    example: [
      { type: 'reentrancy', count: 32 },
      { type: 'access-control', count: 45 },
      { type: 'integer-overflow', count: 12 }
    ]
  })
  vulnerabilityTypes: {
    type: string;
    count: number;
  }[];
}