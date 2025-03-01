import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsNumber, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export class CreateAlertDto {
  @ApiProperty({ description: 'Smart contract address related to this alert', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;

  @ApiProperty({ description: 'Transaction hash that triggered this alert', example: '5ba91d5c2b7fbe1f1d2442c13fc07f354e8b43d8f1200dfeea9bae45dd8ce4e8' })
  @IsString()
  @IsNotEmpty()
  transactionHash: string;

  @ApiProperty({ 
    description: 'Risk score and level information',
    example: {
      score: 85,
      level: 'high'
    }
  })
  riskScore: {
    score: number;
    level: RiskLevel;
  };

  @ApiProperty({ description: 'Detailed description of the security issue', example: 'Potential reentrancy vulnerability detected in swap_tokens function...' })
  @IsString()
  details: string;

  @ApiProperty({ description: 'Timestamp when the alert was created' })
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Array of vulnerability pattern IDs detected', example: ['reentrancy', 'access-control'] })
  @IsArray()
  patternIds: string[];
}

export class AlertDto {
  @ApiProperty({ description: 'Unique identifier for the alert', example: 'alert-1646238234123-1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Smart contract address related to this alert', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  contractAddress: string;

  @ApiProperty({ description: 'Transaction hash that triggered this alert', example: '5ba91d5c2b7fbe1f1d2442c13fc07f354e8b43d8f1200dfeea9bae45dd8ce4e8' })
  @IsString()
  transactionHash: string;

  @ApiProperty({ 
    description: 'Risk score and level information',
    example: {
      score: 85,
      level: 'high'
    }
  })
  riskScore: {
    score: number;
    level: RiskLevel;
  };

  @ApiProperty({ description: 'Detailed description of the security issue', example: 'Potential reentrancy vulnerability detected in swap_tokens function...' })
  @IsString()
  details: string;

  @ApiProperty({ description: 'Timestamp when the alert was created' })
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Array of vulnerability pattern IDs detected', example: ['reentrancy', 'access-control'] })
  @IsArray()
  patternIds: string[];

  @ApiProperty({ description: 'Whether the alert has been resolved', example: false })
  @IsBoolean()
  resolved: boolean;

  @ApiPropertyOptional({ description: 'Notes about how the alert was resolved' })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

export class AlertFilterDto {
  @ApiPropertyOptional({ description: 'Filter alerts by contract address', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  @IsOptional()
  contractAddress?: string;

  @ApiPropertyOptional({ description: 'Filter alerts by minimum risk score', example: 50 })
  @IsNumber()
  @IsOptional()
  minRiskScore?: number;

  @ApiPropertyOptional({ description: 'Filter alerts by resolution status', example: false })
  @IsBoolean()
  @IsOptional()
  resolved?: boolean;

  @ApiPropertyOptional({ description: 'Filter alerts by risk level', enum: RiskLevel })
  @IsEnum(RiskLevel)
  @IsOptional()
  riskLevel?: RiskLevel;
}

export class ResolveAlertDto {
  @ApiPropertyOptional({ description: 'Notes about how the alert was resolved', example: 'Fixed by implementing the checks-effects-interactions pattern' })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

export class AlertStatsSummaryDto {
  @ApiProperty({ description: 'Total number of alerts', example: 87 })
  totalAlerts: number;

  @ApiProperty({ description: 'Number of open (unresolved) alerts', example: 42 })
  openAlerts: number;

  @ApiProperty({ description: 'Number of high or critical risk alerts', example: 15 })
  highRiskAlerts: number;

  @ApiProperty({ description: 'Breakdown of alerts by risk level', 
    example: {
      critical: 5,
      high: 10,
      medium: 27,
      low: 45,
      none: 0
    }
  })
  alertsByRiskLevel: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };

  @ApiProperty({ description: 'Most vulnerable contracts',
    example: [
      { address: 'erd1...', alertCount: 23 },
      { address: 'erd1...', alertCount: 18 }
    ]
  })
  topVulnerableContracts: {
    address: string;
    alertCount: number;
  }[];

  @ApiProperty({ description: 'Most common vulnerability patterns',
    example: [
      { patternId: 'reentrancy', count: 12 },
      { patternId: 'access-control', count: 24 }
    ]
  })
  topVulnerabilityPatterns: {
    patternId: string;
    count: number;
  }[];
}