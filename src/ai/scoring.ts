//import { VulnerabilityPattern } from './patterns';
import { Injectable } from '@nestjs/common';
import { VulnerabilityPattern } from './models/pattern.model';

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

@Injectable()
export class SecurityScoring {
  // Calculate security score based on vulnerabilities
  calculateSecurityScore(vulnerabilities: any[]): number {
    if (!vulnerabilities || vulnerabilities.length === 0) {
      return 100; // Perfect score if no vulnerabilities
    }
    
    // Assign weights to different severity levels
    const severityWeights = {
      'Critical': 30,
      'High': 15,
      'Medium': 7,
      'Low': 3
    };
    
    // Calculate total penalty based on vulnerabilities
    let totalPenalty = 0;
    for (const vuln of vulnerabilities) {
      const severity = vuln.severity || 'Low';
      totalPenalty += severityWeights[severity] || 0;
    }
    
    // Ensure score doesn't go below 0
    const score = Math.max(0, 100 - totalPenalty);
    
    return Math.round(score);
  }
  
  // Get risk level based on security score
  getRiskLevel(score: number): string {
    if (score >= 90) return 'Low Risk';
    if (score >= 70) return 'Moderate Risk';
    if (score >= 40) return 'High Risk';
    return 'Critical Risk';
  }
}

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
  const securityScoring = new SecurityScoring();
  
  // Convert patterns to vulnerabilities format
  const vulnerabilities = patterns.map(pattern => ({
    severity: pattern.severity.charAt(0).toUpperCase() + pattern.severity.slice(1)
  }));
  
  // Calculate base score using SecurityScoring class
  let score = securityScoring.calculateSecurityScore(vulnerabilities);
  
  // Add score for statistical anomalies
  if (isAnomaly) {
    score = Math.max(0, score - ANOMALY_WEIGHT);
  }
  
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