import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@multiversx/sdk-core/out';
import * as ss from 'simple-statistics';
import { knownPatterns, VulnerabilityPattern } from './patterns';
import { RiskScore, calculateRiskScore } from './scoring';

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
  
  // Store transaction history for statistical analysis
  private transactionHistory: Map<string, Transaction[]> = new Map();
  private readonly MAX_HISTORY_SIZE = 1000;

  constructor() {
    this.logger.log('Security Detector initialized');
  }

  /**
   * Analyze a transaction for security issues
   * @param transaction The transaction to analyze
   * @param contractCode Optional contract code (if available)
   * @returns Detection result with security analysis
   */
  public analyzeTransaction(
    transaction: Transaction,
    contractCode?: string,
  ): DetectionResult {
    try {
      // Store transaction in history for pattern recognition
      this.updateTransactionHistory(transaction);

      // 1. Check against known vulnerability patterns
      const matchedPatterns = this.detectKnownPatterns(transaction, contractCode);
      
      // 2. Perform statistical anomaly detection
      const isAnomaly = this.detectAnomalies(transaction);
      
      // 3. Calculate risk score
      const riskScore = calculateRiskScore(matchedPatterns, isAnomaly);

      // 4. Compile results
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

  /**
   * Check transaction against known vulnerability patterns
   */
  private detectKnownPatterns(
    transaction: Transaction,
    contractCode?: string,
  ): VulnerabilityPattern[] {
    const matchedPatterns: VulnerabilityPattern[] = [];

    // Check each known pattern
    for (const pattern of knownPatterns) {
      if (pattern.detector(transaction, contractCode)) {
        matchedPatterns.push(pattern);
      }
    }

    return matchedPatterns;
  }

  /**
   * Detect anomalies using statistical methods
   */
  private detectAnomalies(transaction: Transaction): boolean {
    const contractAddress = transaction.getReceiver().toString();
    const contractHistory = this.transactionHistory.get(contractAddress) || [];
    
    // Not enough history for meaningful analysis
    if (contractHistory.length < 10) {
      return false;
    }

    // Simple anomaly detection based on value
    const values = contractHistory.map(tx => Number(tx.getValue().toString()));
    const mean = ss.mean(values);
    const stdDev = ss.standardDeviation(values);
    const currentValue = Number(transaction.getValue().toString());
    
    // Z-score analysis (value more than 3 standard deviations from mean is suspicious)
    const zScore = Math.abs((currentValue - mean) / stdDev);
    if (zScore > 3) {
      return true;
    }

    // More sophisticated anomaly detection can be added here

    return false;
  }

  /**
   * Update transaction history for a contract
   */
  private updateTransactionHistory(transaction: Transaction): void {
    const contractAddress = transaction.getReceiver().toString();
    
    if (!this.transactionHistory.has(contractAddress)) {
      this.transactionHistory.set(contractAddress, []);
    }
    
    const history = this.transactionHistory.get(contractAddress);
    if (history) {
      history.push(transaction);
    }
    
    // Trim history if it gets too large
    if (history && history.length > this.MAX_HISTORY_SIZE) {
      history.shift(); // Remove oldest transaction
    }
  }

  /**
   * Generate human-readable details about the security issues
   */
  private generateDetails(
    patterns: VulnerabilityPattern[],
    isAnomaly: boolean,
    transaction: Transaction,
  ): string {
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
    
    if (!details) {
      details = 'No security issues detected.';
    }
    
    return details;
  }
}