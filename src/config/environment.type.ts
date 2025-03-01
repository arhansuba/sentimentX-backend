//export type Environment = 'development' | 'production' | 'test';
export enum Environment {
    DEVELOPMENT = 'development',
    STAGING = 'staging',
    PRODUCTION = 'production',
  }
  
  export const CACHE = {
      NO_EXPIRATION: 0,
      SHORT_TTL: 60, // 1 minute
      MEDIUM_TTL: 300, // 5 minutes
      LONG_TTL: 3600, // 1 hour
      KEYS: {
        AI_ANALYSIS_PREFIX: 'ai:analysis:',
        CONTRACT_LIST: 'contracts:list',
        TRANSACTION_LIST: 'transactions:list',
      }
    };
  