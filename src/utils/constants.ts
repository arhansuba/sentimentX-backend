/**
 * MultiversX blockchain constants
 */
export const BLOCKCHAIN = {
    /**
     * EGLD token identifier
     */
    EGLD_TOKEN_ID: 'EGLD',
    
    /**
     * EGLD decimals
     */
    EGLD_DECIMALS: 18,
    
    /**
     * Default gas limit for transactions
     */
    DEFAULT_GAS_LIMIT: 50_000,
    
    /**
     * Gas limit per byte of data
     */
    GAS_PER_DATA_BYTE: 1_500,
    
    /**
     * Gas price modifier
     */
    GAS_PRICE_MODIFIER: 0.01,
    
    /**
     * Default gas price
     */
    DEFAULT_GAS_PRICE: 1_000_000_000,
    
    /**
     * Maximum number of transactions to retrieve at once
     */
    MAX_BULK_TX_COUNT: 100,
    
    /**
     * Transaction status values
     */
    TX_STATUS: {
      PENDING: 'pending',
      SUCCESSFUL: 'success',
      FAILED: 'failed',
      INVALID: 'invalid'
    },
  };
  
  /**
   * Cache settings
   */
  export const CACHE = {
    /**
     * Default TTL for cached items in seconds (5 minutes)
     */
    DEFAULT_TTL: 300,
    
    /**
     * Long TTL for items that change less frequently (1 hour)
     */
    LONG_TTL: 3600,
    
    /**
     * Short TTL for frequently changing items (30 seconds)
     */
    SHORT_TTL: 30,
    
    /**
     * No expiration
     */
    NO_EXPIRATION: 0,
    
    /**
     * Cache keys for various items
     */
    KEYS: {
      CONTRACT_PREFIX: 'contract:',
      ALERT_PREFIX: 'alert:',
      TRANSACTION_PREFIX: 'tx:',
      SECURITY_SCORE_PREFIX: 'security:score:',
      STATS_PREFIX: 'stats:',
      CONTRACT_LIST: 'monitored:contracts',
      AI_ANALYSIS_PREFIX: 'ai:analysis:',
      PATTERN_ANALYSIS_PREFIX: 'pattern:analysis:',
    }
  };
  
  /**
   * API related constants
   */
  export const API = {
    /**
     * Default pagination limit
     */
    DEFAULT_LIMIT: 20,
    
    /**
     * Maximum pagination limit
     */
    MAX_LIMIT: 100,
  };
  
  /**
   * Security constants
   */
  export const SECURITY = {
    /**
     * Security risk levels
     */
    RISK_LEVELS: {
      NONE: 'none',
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical',
      UNKNOWN: 'unknown'
    },
    
    /**
     * Risk score thresholds
     */
    RISK_THRESHOLDS: {
      LOW: 25,
      MEDIUM: 50,
      HIGH: 75,
      CRITICAL: 90
    },
    
    /**
     * Security pattern categories
     */
    PATTERN_CATEGORIES: {
      REENTRANCY: 'reentrancy',
      ACCESS_CONTROL: 'access-control',
      INTEGER_OVERFLOW: 'integer-overflow',
      FLASH_LOAN: 'flash-loan-attack',
      TIMESTAMP_DEPENDENCE: 'timestamp-dependence',
      FRONT_RUNNING: 'front-running',
      DOS: 'denial-of-service'
    },
    
    /**
     * Detection method types
     */
    DETECTION_METHODS: {
      PATTERN: 'pattern',
      AI: 'ai',
      ANOMALY: 'anomaly',
      MANUAL: 'manual'
    }
  };
  
  /**
   * AI related constants
   */
  export const AI = {
    /**
     * Model name for Gemini
     */
    GEMINI_MODEL: 'gemini-1.5-flash',
    
    /**
     * Default analysis parameters
     */
    DEFAULT_ANALYSIS_PARAMS: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    
    /**
     * Time limit for AI analysis in ms (10 seconds)
     */
    ANALYSIS_TIMEOUT: 10000,
  };
  
  /**
   * Frontend related constants
   */
  export const FRONTEND = {
    /**
     * Default date format
     */
    DATE_FORMAT: 'MMM d, yyyy',
    
    /**
     * Date and time format
     */
    DATETIME_FORMAT: 'MMM d, yyyy HH:mm:ss',
    
    /**
     * Status colors
     */
    STATUS_COLORS: {
      SUCCESS: 'bg-green-100 text-green-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800',
      INFO: 'bg-blue-100 text-blue-800',
      NEUTRAL: 'bg-gray-100 text-gray-800'
    }
  };
  
  /**
   * Environment settings
   */
  export type Environment = 'development' | 'production' | 'test';
  
  /**
   * Metrics constants
   */
  export const METRICS = {
    /**
     * Prefix for all metrics
     */
    PREFIX: 'sentinel_',
    
    /**
     * Metric names
     */
    NAMES: {
      TRANSACTIONS_ANALYZED: 'transactions_analyzed_total',
      ALERTS_GENERATED: 'alerts_generated_total',
      SECURITY_SCORE: 'security_score',
      VULNERABILITIES_DETECTED: 'vulnerabilities_detected_total',
      API_RESPONSE_TIME: 'api_response_time_seconds',
      AI_ANALYSIS_TIME: 'ai_analysis_time_seconds',
      AI_ANALYSIS_FAILURES: 'ai_analysis_failures_total'
    }
  };