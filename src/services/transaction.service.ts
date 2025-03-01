import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { BlockchainService } from './blockchain.service';
import { SecurityDetector } from '../ai/detector';
import { Transaction } from '@multiversx/sdk-core/out/transaction';
import { NetworkConfig } from '@multiversx/sdk-network-providers/out/networkConfig';

export interface TransactionAnalysis {
  hash: string;
  sender: string;
  receiver: string;
  value: string;
  timestamp: Date;
  isAnalyzed: boolean;
  securityScore: number;
  riskLevel: string;
  vulnerabilities: string[];
  isAnomaly: boolean;
  functionName?: string;
  gasUsed?: string;
}



@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private analyzedTransactions: Map<string, TransactionAnalysis> = new Map();

  constructor(
    private readonly cacheService: CacheService,
    private readonly blockchainService: BlockchainService,
    private readonly securityDetector: SecurityDetector,
  ) {
    this.loadAnalyzedTransactions();
  }

  /**
   * Get recently analyzed transactions
   */
  getRecentTransactions(limit: number = 50): TransactionAnalysis[] {
    const transactions = Array.from(this.analyzedTransactions.values());
    
    // Sort by timestamp (newest first) and limit the results
    return transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get a transaction analysis by hash
   */
  async getTransactionAnalysis(hash: string): Promise<TransactionAnalysis | null> {
    // Check if we already have the analysis
    if (this.analyzedTransactions.has(hash)) {
      return this.analyzedTransactions.get(hash) || null;
    }
    
    // Otherwise, try to fetch and analyze the transaction
    try {
      const transaction = await this.blockchainService.getTransaction(hash);
      
      if (!transaction) {
        return null;
      }
      
      // Analyze the transaction
      const convertedTransaction = new Transaction({
        nonce: transaction.nonce,
        value: transaction.value,
        receiver: transaction.receiver,
        sender: transaction.sender,
        gasPrice: transaction.gasPrice,
        gasLimit: transaction.gasLimit,
        data: {
          length: () => transaction.data.length,
          encoded: () => transaction.data.toString('base64'),
          toString: () => transaction.data.toString(),
          valueOf: () => transaction.data
        },
        chainID: ((await this.blockchainService.getNetworkConfig()) as unknown as NetworkConfig)?.ChainID || '',
      });
      const analysisResult = this.securityDetector.analyzeTransaction(convertedTransaction);
      
      // Create a transaction analysis record
      const analysis: TransactionAnalysis = {
        hash: hash,
        sender: transaction.sender.toString(),
        receiver: transaction.receiver.toString(),
        value: transaction.value.toString(),
        timestamp: new Date(),
        isAnalyzed: true,
        securityScore: analysisResult.riskScore.score,
        riskLevel: analysisResult.riskScore.level,
        vulnerabilities: analysisResult.matchedPatterns.map(p => p.id),
        isAnomaly: analysisResult.isAnomaly,
        functionName: this.extractFunctionName(transaction.data.toString()),
        gasUsed: transaction.gasLimit.toString(),
      };
      
      // Store the analysis
      this.analyzedTransactions.set(hash, analysis);
      await this.saveAnalyzedTransactions();
      
      return analysis;
    } catch (error) {
      this.logger.error(`Error analyzing transaction ${hash}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get transactions for a specific contract
   */
  getTransactionsByContract(contractAddress: string, limit: number = 20): TransactionAnalysis[] {
    const transactions = Array.from(this.analyzedTransactions.values())
      .filter(tx => tx.receiver === contractAddress)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    
    return transactions;
  }

  /**
   * Get high-risk transactions
   */
  getHighRiskTransactions(minScore: number = 50): TransactionAnalysis[] {
    return Array.from(this.analyzedTransactions.values())
      .filter(tx => tx.securityScore >= minScore)
      .sort((a, b) => b.securityScore - a.securityScore);
  }

  /**
   * Extract function name from transaction data
   */
  private extractFunctionName(data: string): string | undefined {
    if (!data || data.length < 8) {
      return undefined;
    }
    
    try {
      // This is a simplified version - in a real implementation,
      // you would decode the smart contract function selector properly
      // For now, we'll just extract the first part of the data as a proxy
      // for the function name
      const parts = data.split('@');
      if (parts.length > 0) {
        return parts[0];
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Save analyzed transactions to cache
   */
  private async saveAnalyzedTransactions(): Promise<void> {
    try {
      const transactions = Array.from(this.analyzedTransactions.values());
      
      // Limit the number of cached transactions to the 500 most recent
      const recentTransactions = transactions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 500);
      
      await this.cacheService.setLocal('analyzed:transactions', recentTransactions, 0);
    } catch (error) {
      this.logger.error(`Error saving analyzed transactions: ${error.message}`);
    }
  }

  /**
   * Load analyzed transactions from cache
   */
  private async loadAnalyzedTransactions(): Promise<void> {
    try {
      const transactions = await this.cacheService.getLocal<TransactionAnalysis[]>('analyzed:transactions');
      
      if (transactions && Array.isArray(transactions)) {
        // Parse date strings back to Date objects
        transactions.forEach(tx => {
          if (typeof tx.timestamp === 'string') {
            tx.timestamp = new Date(tx.timestamp);
          }
          this.analyzedTransactions.set(tx.hash, tx);
        });
        
        this.logger.log(`Loaded ${transactions.length} analyzed transactions from storage`);
      }
    } catch (error) {
      this.logger.error(`Error loading analyzed transactions: ${error.message}`);
    }
  }
}