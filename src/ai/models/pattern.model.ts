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