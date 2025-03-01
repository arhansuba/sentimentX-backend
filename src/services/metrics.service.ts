import { Injectable, Logger } from '@nestjs/common';
import * as prom from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly registry: prom.Registry;
  
  // Define metrics
  private transactionsAnalyzedCounter: prom.Counter<string>;
  private alertsGeneratedCounter: prom.Counter<string>;
  private securityScoreHistogram: prom.Histogram<string>;
  private vulnerabilityCounter: prom.Counter<string>;
  private apiResponseTimeHistogram: prom.Histogram<string>;

  constructor() {
    // Create a new registry
    this.registry = new prom.Registry();
    
    // Register default metrics
    prom.collectDefaultMetrics({ register: this.registry });
    
    // Initialize custom metrics
    this.initMetrics();
    
    this.logger.log('Metrics service initialized');
  }

  /**
   * Initialize custom metrics
   */
  private initMetrics() {
    // Counter for analyzed transactions
    this.transactionsAnalyzedCounter = new prom.Counter({
      name: 'sentinel_transactions_analyzed_total',
      help: 'Total number of analyzed transactions',
      labelNames: ['contract_address'],
      registers: [this.registry]
    });

    // Counter for generated alerts
    this.alertsGeneratedCounter = new prom.Counter({
      name: 'sentinel_alerts_generated_total',
      help: 'Total number of security alerts generated',
      labelNames: ['risk_level', 'contract_address'],
      registers: [this.registry]
    });

    // Histogram for security scores
    this.securityScoreHistogram = new prom.Histogram({
      name: 'sentinel_security_score',
      help: 'Distribution of security scores for analyzed transactions',
      labelNames: ['contract_address'],
      buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      registers: [this.registry]
    });

    // Counter for detected vulnerabilities
    this.vulnerabilityCounter = new prom.Counter({
      name: 'sentinel_vulnerabilities_detected_total',
      help: 'Total number of vulnerabilities detected by type',
      labelNames: ['vulnerability_type', 'contract_address'],
      registers: [this.registry]
    });

    // Histogram for API response times
    this.apiResponseTimeHistogram = new prom.Histogram({
      name: 'sentinel_api_response_time_seconds',
      help: 'Response time of API endpoints',
      labelNames: ['method', 'route', 'status_code'],
      buckets: prom.exponentialBuckets(0.01, 2, 10), // From 10ms to ~10s
      registers: [this.registry]
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Record transaction analysis
   */
  recordTransactionAnalyzed(contractAddress: string) {
    this.transactionsAnalyzedCounter.inc({ contract_address: contractAddress });
  }

  /**
   * Record generated alert
   */
  recordAlertGenerated(riskLevel: string, contractAddress: string) {
    this.alertsGeneratedCounter.inc({ 
      risk_level: riskLevel,
      contract_address: contractAddress
    });
  }

  /**
   * Record security score
   */
  recordSecurityScore(score: number, contractAddress: string) {
    this.securityScoreHistogram.observe(
      { contract_address: contractAddress },
      score
    );
  }

  /**
   * Record detected vulnerability
   */
  recordVulnerabilityDetected(
    vulnerabilityType: string,
    contractAddress: string,
    count: number = 1
  ) {
    this.vulnerabilityCounter.inc(
      { vulnerability_type: vulnerabilityType, contract_address: contractAddress },
      count
    );
  }

  /**
   * Record API response time
   */
  recordApiResponseTime(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number
  ) {
    this.apiResponseTimeHistogram.observe(
      { method, route, status_code: statusCode.toString() },
      durationSeconds
    );
  }

  /**
   * Start a timer for measuring API response time
   */
  startTimer() {
    return this.apiResponseTimeHistogram.startTimer();
  }
}