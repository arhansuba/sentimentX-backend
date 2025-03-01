import { VulnerabilityPattern } from './patterns';

/**
 * Risk level classification for detected issues
 */
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';

/**
 * Risk score for a contract or transaction
 */
export interface RiskScore {
  score: number;        // Score from 0-100, higher is more risky
  level: RiskLevel;     // Categorical risk level
}

/**
 * Weights for different types of security issues
 */
const SEVERITY_WEIGHTS = {
  critical: 25,
  high: 15,
  medium: 10,
  low: 5,
};

const ANOMALY_WEIGHT = 20;

/**
 * Calculate a risk score based on detected patterns and anomalies
 * @param patterns Array of vulnerability patterns detected
 * @param isAnomaly Whether statistical anomalies were detected
 * @returns Risk score object with numerical score and categorical level
 */
export function calculateRiskScore(
  patterns: VulnerabilityPattern[],
  isAnomaly: boolean,
): RiskScore {
  // Start with a base score of 0
  let score = 0;
  
  // Add score for each detected pattern based on severity
  for (const pattern of patterns) {
    score += SEVERITY_WEIGHTS[pattern.severity] || 0;
  }
  
  // Add score for statistical anomalies
  if (isAnomaly) {
    score += ANOMALY_WEIGHT;
  }
  
  // Cap score at 100
  score = Math.min(score, 100);
  
  // Determine risk level based on score
  let level: RiskLevel = 'none';
  
  if (score >= 75) {
    level = 'critical';
  } else if (score >= 50) {
    level = 'high';
  } else if (score >= 25) {
    level = 'medium';
  } else if (score > 0) {
    level = 'low';
  }
  
  return { score, level };
}

/**
 * Generates a human-readable description of a risk score
 * @param riskScore Risk score object
 * @returns Human-readable description
 */
export function describeRiskScore(riskScore: RiskScore): string {
  switch (riskScore.level) {
    case 'critical':
      return `Critical risk (${riskScore.score}/100): Immediate action required. High likelihood of exploit.`;
    case 'high':
      return `High risk (${riskScore.score}/100): Serious security concerns detected. Investigation strongly recommended.`;
    case 'medium':
      return `Medium risk (${riskScore.score}/100): Potential security issues identified. Review recommended.`;
    case 'low':
      return `Low risk (${riskScore.score}/100): Minor security concerns detected. Consider reviewing.`;
    case 'none':
      return `No risk detected (${riskScore.score}/100): No security issues found.`;
    default:
      return `Unknown risk level (${riskScore.score}/100): Unable to determine risk.`;
  }
}