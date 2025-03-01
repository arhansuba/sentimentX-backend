import { Transaction } from '@multiversx/sdk-core/out';

/**
 * Interface for vulnerability patterns to be detected
 */
export interface VulnerabilityPattern {
  /**
   * Unique identifier for the pattern
   */
  id: string;

  /**
   * Human-readable name of the vulnerability
   */
  name: string;

  /**
   * Detailed description of the vulnerability
   */
  description: string;

  /**
   * Risk severity level
   */
  severity: 'critical' | 'high' | 'medium' | 'low';

  /**
   * Category of the vulnerability
   */
  category: string;

  /**
   * Function that detects if the pattern exists in a transaction or contract
   * @param transaction Transaction to analyze
   * @param contractCode Optional contract code for deeper analysis
   * @returns Whether the pattern was detected
   */
  detector: (transaction: Transaction, contractCode?: string) => boolean;
}

/**
 * Result of a pattern detection analysis
 */
export interface PatternDetectionResult {
  /**
   * Transaction hash
   */
  transactionHash: string;

  /**
   * Contract address
   */
  contractAddress: string;

  /**
   * Patterns that were detected
   */
  matchedPatterns: VulnerabilityPattern[];

  /**
   * Overall risk score (0-100)
   */
  score: number;

  /**
   * Risk level based on score
   */
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';

  /**
   * Timestamp of the analysis
   */
  timestamp: number;

  /**
   * Detailed description of findings
   */
  details: string;
}

/**
 * Base detector class for implementing pattern detection
 */
export abstract class BasePatternDetector {
  /**
   * Pattern information
   */
  abstract readonly pattern: VulnerabilityPattern;

  /**
   * Analyze a transaction for the specific vulnerability pattern
   * @param transaction Transaction to analyze
   * @param contractCode Optional contract code to analyze
   * @returns Whether the vulnerability was detected
   */
  detect(transaction: Transaction, contractCode?: string): boolean {
    return this.pattern.detector(transaction, contractCode);
  }

  /**
   * Get details about why the pattern was detected
   * @param transaction Transaction that was analyzed
   * @param contractCode Optional contract code that was analyzed
   * @returns Human-readable explanation of the detected vulnerability
   */
  abstract getDetails(transaction: Transaction, contractCode?: string): string;

  /**
   * Get recommendations on how to fix the vulnerability
   * @returns Human-readable recommendations
   */
  abstract getRecommendations(): string;
}

export const VULNERABILITY_PATTERNS: VulnerabilityPattern[] = [
  {
    id: 'REENTRANCY-001',
    name: 'Reentrancy Vulnerability',
    description: 'Contract state is modified after external calls, allowing potential reentrancy attacks',
    severity: 'critical',
    category: 'Reentrancy',
    detector: (transaction: Transaction, contractCode?: string) => {
      // Implement the detection logic for Reentrancy
      return false;
    }
  },
  {
    id: 'OVERFLOW-001',
    name: 'Integer Overflow/Underflow',
    description: 'Arithmetic operations can lead to overflow/underflow without proper checks',
    severity: 'high',
    category: 'Arithmetic',
    detector: (transaction: Transaction, contractCode?: string) => {
      // Implement the detection logic for Overflow/Underflow
      return false;
    }
  },
  {
    id: 'ACCESS-CONTROL-001',
    name: 'Missing Access Control',
    description: 'Critical functions lack proper access control mechanisms',
    severity: 'high',
    category: 'Access Control',
    detector: (transaction: Transaction, contractCode?: string) => {
      // Implement the detection logic for Access Control
      return false;
    }
  },
  {
    id: 'FLASHLOAN-001',
    name: 'Flash Loan Attack Vulnerability',
    description: 'Contract is vulnerable to price manipulation via flash loans',
    severity: 'critical',
    category: 'Price Manipulation',
    detector: (transaction: Transaction, contractCode?: string) => {
      // Implement the detection logic for Flash Loan Attack
      return false;
    }
  },
  // Add more patterns as needed
];