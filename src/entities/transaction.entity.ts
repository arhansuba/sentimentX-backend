import { RiskLevel } from '../dtos/alert.dto';

/**
 * Entity representing an analyzed transaction
 */
export class TransactionAnalysis {
  /**
   * Transaction hash
   */
  hash: string;

  /**
   * Sender address
   */
  sender: string;

  /**
   * Receiver address
   */
  receiver: string;

  /**
   * Transaction value in smallest denomination
   */
  value: string;

  /**
   * Timestamp of analysis
   */
  timestamp: Date;

  /**
   * Whether the transaction has been analyzed
   */
  isAnalyzed: boolean;

  /**
   * Security score (0-100)
   */
  securityScore: number;

  /**
   * Risk level based on security score
   */
  riskLevel: RiskLevel;

  /**
   * List of detected vulnerabilities
   */
  vulnerabilities: string[];

  /**
   * Whether the transaction shows anomalous patterns
   */
  isAnomaly: boolean;

  /**
   * Function name being called
   */
  functionName?: string;

  /**
   * Gas used by the transaction
   */
  gasUsed?: string;

  /**
   * Raw transaction data field
   */
  dataField?: string;

  /**
   * Additional metadata about the transaction
   */
  metadata?: Record<string, any>;

  constructor(data: Partial<TransactionAnalysis>) {
    this.hash = data.hash || '';
    this.sender = data.sender || '';
    this.receiver = data.receiver || '';
    this.value = data.value || '';
    this.timestamp = data.timestamp || new Date();
    this.isAnalyzed = data.isAnalyzed || false;
    this.securityScore = data.securityScore || 0;
    this.riskLevel = data.riskLevel || RiskLevel.UNKNOWN;
    this.vulnerabilities = data.vulnerabilities || [];
    this.isAnomaly = data.isAnomaly || false;
    this.functionName = data.functionName || '';
    this.gasUsed = data.gasUsed || '';
    this.dataField = data.dataField || '';
    this.metadata = data.metadata || {};
  }
}

/**
 * Entity representing a detected vulnerability in a transaction
 */
export class TransactionVulnerability {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Transaction hash
   */
  transactionHash: string;

  /**
   * Vulnerability pattern ID
   */
  patternId: string;

  /**
   * Vulnerability name
   */
  name: string;

  /**
   * Vulnerability description
   */
  description: string;

  /**
   * Risk severity
   */
  severity: string;

  /**
   * Detection confidence (0-1)
   */
  confidence: number;

  /**
   * Detection method (pattern, ai, anomaly)
   */
  detectionMethod: string;

  /**
   * Time when detected
   */
  detectedAt: Date;

  constructor(data: Partial<TransactionVulnerability>) {
    this.id = data.id || '';
    this.transactionHash = data.transactionHash || '';
    this.patternId = data.patternId || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.severity = data.severity || '';
    this.confidence = data.confidence || 0;
    this.detectionMethod = data.detectionMethod || '';
    this.detectedAt = data.detectedAt || new Date();
  }
}

/**
 * Statistics about analyzed transactions
 */
export interface TransactionStatistics {
  /**
   * Total number of analyzed transactions
   */
  totalTransactions: number;

  /**
   * Number of transactions with security issues
   */
  transactionsWithIssues: number;

  /**
   * Number of high-risk transactions
   */
  highRiskTransactions: number;

  /**
   * Number of anomalous transactions
   */
  anomalousTransactions: number;

  /**
   * Average security score across all transactions
   */
  averageSecurityScore: number;

  /**
   * Distribution of transactions by risk level
   */
  riskLevelDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };

  /**
   * Most common vulnerability types found
   */
  vulnerabilityTypes: {
    type: string;
    count: number;
  }[];
}