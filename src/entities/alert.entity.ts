import { RiskLevel } from '../dtos/alert.dto';

/**
 * Entity representing a security alert
 */
export class Alert {
  /**
   * Unique identifier for the alert
   */
  id?: string;

  /**
   * Contract address related to this alert
   */
  contractAddress: string;

  /**
   * Transaction hash that triggered this alert
   */
  transactionHash: string;

  /**
   * Risk score information
   */
  riskScore: {
    /**
     * Numerical score (0-100)
     */
    score: number;

    /**
     * Categorical risk level
     */
    level: RiskLevel;
  };

  /**
   * Detailed description of the security issue
   */
  details: string;

  /**
   * Timestamp when the alert was created
   */
  timestamp: Date;

  /**
   * Array of vulnerability pattern IDs detected
   */
  patternIds: string[];

  /**
   * Whether the alert has been resolved
   */
  resolved: boolean;

  /**
   * Notes about how the alert was resolved
   */
  resolutionNotes?: string;

  /**
   * Any additional data related to the alert
   */
  metadata?: Record<string, any>;

  constructor(data: Partial<Alert>) {
    this.id = data.id;
    this.contractAddress = data.contractAddress || '';
    this.transactionHash = data.transactionHash || '';
    this.riskScore = data.riskScore || { score: 0, level: RiskLevel.UNKNOWN };
    this.details = data.details || '';
    this.timestamp = data.timestamp || new Date();
    this.patternIds = data.patternIds || [];
    this.resolved = data.resolved || false;
    this.resolutionNotes = data.resolutionNotes;
    this.metadata = data.metadata;
  }
}

/**
 * Alert type based on the source of detection
 */
export enum AlertType {
  PATTERN_DETECTION = 'pattern',
  AI_ANALYSIS = 'ai',
  ANOMALY_DETECTION = 'anomaly',
  MANUAL = 'manual'
}

/**
 * Alert statistics for reporting and dashboards
 */
export interface AlertStats {
  /**
   * Total number of alerts
   */
  totalAlerts: number;

  /**
   * Number of open (unresolved) alerts
   */
  openAlerts: number;

  /**
   * Number of high or critical risk alerts
   */
  highRiskAlerts: number;

  /**
   * Breakdown of alerts by risk level
   */
  alertsByRiskLevel: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };

  /**
   * Most vulnerable contracts
   */
  topVulnerableContracts: {
    address: string;
    alertCount: number;
  }[];

  /**
   * Most common vulnerability patterns
   */
  topVulnerabilityPatterns: {
    patternId: string;
    count: number;
  }[];
}