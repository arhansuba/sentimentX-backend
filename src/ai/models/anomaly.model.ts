import { Transaction } from '@multiversx/sdk-core/out';

/**
 * Interface for transaction anomaly detection models
 */
export interface AnomalyDetectionModel {
  /**
   * Unique model identifier
   */
  id: string;

  /**
   * Human-readable name of the model
   */
  name: string;

  /**
   * Description of what the model detects
   */
  description: string;

  /**
   * Analyze a transaction for anomalies
   * @param transaction Transaction to analyze
   * @param historicalData Optional array of historical transactions for comparison
   * @returns Anomaly detection result
   */
  detect(transaction: Transaction, historicalData?: Transaction[]): AnomalyDetectionResult;
}

/**
 * Result from an anomaly detection analysis
 */
export interface AnomalyDetectionResult {
  /**
   * Whether an anomaly was detected
   */
  isAnomaly: boolean;

  /**
   * Confidence score for the anomaly (0-1)
   */
  confidence: number;

  /**
   * Anomaly type if detected
   */
  anomalyType?: string;

  /**
   * Human-readable explanation of the anomaly
   */
  explanation?: string;

  /**
   * Optional statistics about the anomaly
   */
  statistics?: Record<string, any>;
}

/**
 * Base class for statistical anomaly detection
 */
export abstract class BaseAnomalyDetector implements AnomalyDetectionModel {
  /**
   * Unique model identifier
   */
  abstract readonly id: string;

  /**
   * Human-readable name of the model
   */
  abstract readonly name: string;

  /**
   * Description of what the model detects
   */
  abstract readonly description: string;

  /**
   * Detect anomalies in a transaction
   * @param transaction Transaction to analyze
   * @param historicalData Optional array of historical transactions for comparison
   * @returns Anomaly detection result
   */
  abstract detect(transaction: Transaction, historicalData?: Transaction[]): AnomalyDetectionResult;

  /**
   * Calculate Z-score (how many standard deviations from the mean)
   * @param value Value to check
   * @param mean Mean of the distribution
   * @param stdDev Standard deviation of the distribution
   * @returns Z-score value
   */
  protected calculateZScore(value: number, mean: number, stdDev: number): number {
    // Avoid division by zero
    if (stdDev === 0) {
      return value === mean ? 0 : 10; // If value equals mean, z-score is 0, otherwise it's infinitely anomalous
    }
    return Math.abs((value - mean) / stdDev);
  }

  /**
   * Calculate mean of an array of numbers
   * @param values Array of values
   * @returns Mean value
   */
  protected calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Calculate standard deviation of an array of numbers
   * @param values Array of values
   * @param mean Mean value (optional, will be calculated if not provided)
   * @returns Standard deviation
   */
  protected calculateStdDev(values: number[], mean?: number): number {
    if (values.length <= 1) return 0;
    
    const avg = mean !== undefined ? mean : this.calculateMean(values);
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Check if a value is an outlier using the Z-score method
   * @param value Value to check
   * @param values Array of comparison values
   * @param threshold Z-score threshold for outlier detection (default: 3)
   * @returns Whether the value is an outlier
   */
  protected isOutlier(value: number, values: number[], threshold: number = 3): boolean {
    if (values.length < 2) return false;
    
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);
    const zScore = this.calculateZScore(value, mean, stdDev);
    
    return zScore > threshold;
  }
}