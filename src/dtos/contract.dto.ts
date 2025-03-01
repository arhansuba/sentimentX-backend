import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class AddContractDto {
  @ApiProperty({ description: 'Blockchain address of the smart contract', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;

  @ApiPropertyOptional({ description: 'Display name for the contract', example: 'Token Swap Contract' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'The contract code if available' })
  @IsString()
  @IsOptional()
  contractCode?: string;

  @ApiPropertyOptional({ description: 'Tags associated with the contract', example: ['defi', 'swap'] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class RemoveContractDto {
  @ApiProperty({ description: 'Blockchain address of the smart contract', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;
}

export class ContractHealthDto {
  @ApiProperty({ description: 'Blockchain address of the smart contract', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;
  
  @ApiProperty({ description: 'Display name for the contract', example: 'Token Swap Contract' })
  @IsString()
  name: string;
  
  @ApiProperty({ description: 'Overall security score (0-100)', example: 78 })
  securityScore: number;
  
  @ApiProperty({ description: 'Total number of alerts for this contract', example: 5 })
  alertCount: number;
  
  @ApiProperty({ description: 'Number of high or critical risk alerts', example: 2 })
  highRiskAlerts: number;
  
  @ApiPropertyOptional({ description: 'Whether this contract has been verified', example: true })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
  
  @ApiPropertyOptional({ description: 'Last time this contract was analyzed', example: '2025-03-01T12:34:56Z' })
  @IsOptional()
  lastAnalyzed?: Date;
}

export class AnalyzeContractDto {
  @ApiProperty({ description: 'Blockchain address of the smart contract', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;

  @ApiPropertyOptional({ description: 'The contract code if available' })
  @IsString()
  @IsOptional()
  contractCode?: string;
}

export class ContractAnalysisResultDto {
  @ApiProperty({ description: 'Blockchain address of the smart contract', example: 'erd1qqqqqqqqqqqqqpgq5l7ks6p8x20u8ehc3kr0gs35l687n24ay40q2f254k' })
  contractAddress: string;
  
  @ApiProperty({ description: 'Overall security score (0-100)', example: 78 })
  securityScore: number;
  
  @ApiProperty({ description: 'Risk level based on security score', example: 'medium', enum: ['none', 'low', 'medium', 'high', 'critical'] })
  riskLevel: string;
  
  @ApiProperty({ description: 'Array of vulnerability objects detected' })
  vulnerabilities: {
    id: string;
    name: string;
    description: string;
    severity: string;
    location?: string;
    recommendation?: string;
  }[];
  
  @ApiProperty({ description: 'Time when the analysis was performed' })
  analyzedAt: Date;
}