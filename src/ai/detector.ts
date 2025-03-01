import { Injectable, Logger } from '@nestjs/common';
import { Transaction, TransactionPayload, Address } from '@multiversx/sdk-core/out'; // Removed GasLimit and ChainID
import * as ss from 'simple-statistics';
import { GeminiService } from './gemini-service';
import { ReentrancyDetector } from './detectors/reentrancy.detector';
import { OverflowDetector } from './detectors/overflow.detector';
import { AccessControlDetector } from './detectors/access-control.detector';
import { FlashLoanDetector } from './detectors/flashloan.detector';
import * as fs from 'fs';
import * as path from 'path';
import { RiskScore, SecurityScoring, calculateRiskScore } from './scoring';
import { VulnerabilityPattern } from './models/pattern.model';

interface PatternModel {
  id: string;
  name: string;
  description: string;
  example: string;
}

interface AnomalyModel {
  id: string;
  contractId: string;
  patternId: string;
  lines: number[];
  description: string;
  impact: string;
  recommendation: string;
  severity: string;
  timestamp: Date;
  score: number;
}

const VULNERABILITY_PATTERNS: PatternModel[] = [
  { id: 'REENTRANCY-001', name: 'Reentrancy', description: 'Reentrancy attack pattern', example: '...' },
  { id: 'OVERFLOW-001', name: 'Overflow', description: 'Integer overflow pattern', example: '...' },
  { id: 'ACCESS-CONTROL-001', name: 'Access Control', description: 'Access control issue', example: '...' },
  { id: 'FLASHLOAN-001', name: 'Flash Loan', description: 'Flash loan attack pattern', example: '...' },
];

const knownPatterns: VulnerabilityPattern[] = [
  {
    id: 'reentrancy',
    name: 'Reentrancy',
    description: 'Reentrancy attack pattern',
    detector: (tx: Transaction, code?: string) => false,
    severity: 'critical',
    category: '',
  },
];

export interface DetectionResult {
  transactionHash: string;
  contractAddress: string;
  isAnomaly: boolean;
  matchedPatterns: VulnerabilityPattern[];
  riskScore: RiskScore;
  timestamp: number;
  details: string;
}

@Injectable()
export class SecurityDetector {
  private readonly logger = new Logger(SecurityDetector.name);
  private transactionHistory: Map<string, Transaction[]> = new Map();
  private readonly MAX_HISTORY_SIZE = 1000;

  constructor(
    private readonly geminiService: GeminiService,
    private readonly reentrancyDetector: ReentrancyDetector,
    private readonly overflowDetector: OverflowDetector,
    private readonly accessControlDetector: AccessControlDetector,
    private readonly flashloanDetector: FlashLoanDetector,
    private readonly securityScoring: SecurityScoring,
  ) {
    this.logger.log('Security Detector initialized');
  }

  public analyzeTransaction(transaction: Transaction, contractCode?: string): DetectionResult {
    try {
      this.updateTransactionHistory(transaction);
      const matchedPatterns = this.detectKnownPatterns(transaction, contractCode);
      const isAnomaly = this.detectAnomalies(transaction);
      const riskScore = calculateRiskScore(matchedPatterns, isAnomaly);
      return {
        transactionHash: transaction.getHash().toString(),
        contractAddress: transaction.getReceiver().toString(),
        isAnomaly,
        matchedPatterns,
        riskScore,
        timestamp: Date.now(),
        details: this.generateDetails(matchedPatterns, isAnomaly, transaction),
      };
    } catch (error) {
      this.logger.error(`Error analyzing transaction: ${error.message}`);
      return {
        transactionHash: transaction.getHash().toString(),
        contractAddress: transaction.getReceiver().toString(),
        isAnomaly: false,
        matchedPatterns: [],
        riskScore: { score: 0, level: 'unknown' },
        timestamp: Date.now(),
        details: `Error analyzing transaction: ${error.message}`,
      };
    }
  }

  private detectKnownPatterns(transaction: Transaction, contractCode?: string): VulnerabilityPattern[] {
    const matchedPatterns: VulnerabilityPattern[] = [];
    for (const pattern of knownPatterns) {
      if (pattern.detector(transaction, contractCode)) {
        matchedPatterns.push(pattern);
      }
    }
    return matchedPatterns;
  }

  private detectAnomalies(transaction: Transaction): boolean {
    const contractAddress = transaction.getReceiver().toString();
    const contractHistory = this.transactionHistory.get(contractAddress) || [];
    if (contractHistory.length < 10) return false;
    const values = contractHistory.map(tx => Number(tx.getValue().toString()));
    const mean = ss.mean(values);
    const stdDev = ss.standardDeviation(values);
    const currentValue = Number(transaction.getValue().toString());
    const zScore = Math.abs((currentValue - mean) / stdDev);
    return zScore > 3;
  }

  private updateTransactionHistory(transaction: Transaction): void {
    const contractAddress = transaction.getReceiver().toString();
    if (!this.transactionHistory.has(contractAddress)) {
      this.transactionHistory.set(contractAddress, []);
    }
    const history = this.transactionHistory.get(contractAddress);
    if (history) {
      history.push(transaction);
      if (history.length > this.MAX_HISTORY_SIZE) history.shift();
    }
  }

  private generateDetails(patterns: VulnerabilityPattern[], isAnomaly: boolean, transaction: Transaction): string {
    let details = '';
    if (patterns.length > 0) {
      details += 'Detected patterns:\n';
      patterns.forEach(pattern => {
        details += `- ${pattern.name}: ${pattern.description}\n`;
      });
    }
    if (isAnomaly) {
      const contractAddress = transaction.getReceiver().toString();
      const contractHistory = this.transactionHistory.get(contractAddress) || [];
      const values = contractHistory.map(tx => Number(tx.getValue().toString()));
      const mean = ss.mean(values);
      const currentValue = Number(transaction.getValue().toString());
      details += 'Statistical anomaly detected:\n';
      details += `- Transaction value (${currentValue}) significantly deviates from historical average (${mean.toFixed(2)})\n`;
    }
    return details || 'No security issues detected.';
  }

  async analyzeContract(contractId: string, contractCode: string, fileName: string): Promise<any> {
    const fullAnalysis = await this.geminiService.analyzeSmartContract(contractCode, fileName);

    // Create a mock Transaction using primitive types for gasLimit and chainID
    const mockTransaction = new Transaction({
      data: new TransactionPayload(contractCode),
      sender: new Address('erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'),
      receiver: new Address('erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'),
      gasLimit: 50000, // Use number instead of GasLimit
      chainID: 'D',    // Use string instead of ChainID
    });

    const [reentrancyResults, overflowResults, accessControlResults, flashloanResults] = await Promise.all([
      this.reentrancyDetector.detect(mockTransaction, fileName),
      this.overflowDetector.detect(mockTransaction, fileName),
      this.accessControlDetector.detect(mockTransaction, fileName),
      this.flashloanDetector.detect(mockTransaction, fileName),
    ]);

    const anomalies = this.generateAnomalies(contractId, fullAnalysis.vulnerabilities || []);
    const securityScore = fullAnalysis.securityScore || this.securityScoring.calculateSecurityScore(fullAnalysis.vulnerabilities || []);
    const riskLevel = this.securityScoring.getRiskLevel(securityScore);

    return {
      contractId,
      fileName,
      fullAnalysis,
      detectors: {
        reentrancy: reentrancyResults,
        overflow: overflowResults,
        accessControl: accessControlResults,
        flashloan: flashloanResults,
      },
      anomalies,
      securityScore,
      riskLevel,
      summary: fullAnalysis.summary || this.generateSummary(anomalies, securityScore, riskLevel),
    };
  }

  async analyzeContractFile(contractId: string, filePath: string): Promise<any> {
    try {
      const contractCode = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      return this.analyzeContract(contractId, contractCode, fileName);
    } catch (error) {
      this.logger.error('Error analyzing contract file:', error);
      throw new Error(`Failed to analyze contract file: ${error.message}`);
    }
  }

  private generateAnomalies(contractId: string, vulnerabilities: any[]): AnomalyModel[] {
    return vulnerabilities.map((vuln, index) => {
      const pattern = this.findMatchingPattern(vuln.type) || VULNERABILITY_PATTERNS[0];
      return {
        id: `ANOMALY-${index + 1}`,
        contractId,
        patternId: pattern.id,
        lines: vuln.lines || [],
        description: vuln.description || '',
        impact: vuln.impact || '',
        recommendation: vuln.recommendation || '',
        severity: vuln.severity || 'Medium',
        timestamp: new Date(),
        score: this.calculateAnomalyScore(vuln.severity || 'Medium'),
      };
    });
  }

  private findMatchingPattern(vulnerabilityType: string): PatternModel | undefined {
    const lowerCaseType = vulnerabilityType.toLowerCase();
    if (lowerCaseType.includes('reentrancy')) {
      return VULNERABILITY_PATTERNS.find(p => p.id === 'REENTRANCY-001');
    }
    if (lowerCaseType.includes('overflow') || lowerCaseType.includes('underflow')) {
      return VULNERABILITY_PATTERNS.find(p => p.id === 'OVERFLOW-001');
    }
    if (lowerCaseType.includes('access control') || lowerCaseType.includes('permission')) {
      return VULNERABILITY_PATTERNS.find(p => p.id === 'ACCESS-CONTROL-001');
    }
    if (lowerCaseType.includes('flash loan') || lowerCaseType.includes('price manipulation')) {
      return VULNERABILITY_PATTERNS.find(p => p.id === 'FLASHLOAN-001');
    }
    return undefined;
  }

  private calculateAnomalyScore(severity: string): number {
    switch (severity) {
      case 'Critical': return 10;
      case 'High': return 7;
      case 'Medium': return 4;
      case 'Low': return 1;
      default: return 1;
    }
  }

  private generateSummary(anomalies: AnomalyModel[], securityScore: number, riskLevel: string): string {
    const criticalCount = anomalies.filter(a => a.severity === 'Critical').length;
    const highCount = anomalies.filter(a => a.severity === 'High').length;
    const mediumCount = anomalies.filter(a => a.severity === 'Medium').length;
    const lowCount = anomalies.filter(a => a.severity === 'Low').length;
    return `Analysis found ${anomalies.length} potential vulnerabilities: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, and ${lowCount} low. Overall security score: ${securityScore}/100 (${riskLevel}).`;
  }
}