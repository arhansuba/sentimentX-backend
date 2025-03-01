import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyNetworkProvider, TransactionOnNetwork, AccountOnNetwork } from '@multiversx/sdk-network-providers/out';
import { Transaction, Address, TransactionHash } from '@multiversx/sdk-core/out';
import WebSocket from 'ws';
import { SecurityDetector } from '../ai/detector';
import { AlertService } from './alert.service';
import { CacheService } from './cache.service';

@Injectable()
export class BlockchainService implements OnModuleInit {
  getNetworkConfig() {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ProxyNetworkProvider;
  private wsConnection: WebSocket;
  private monitoredContracts: Set<string> = new Set();
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly securityDetector: SecurityDetector,
    private readonly alertService: AlertService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    // Initialize the provider based on environment
    const apiUrl = this.configService.get<string>('MULTIVERSX_API_URL');
    if (!apiUrl) {
      throw new Error('MULTIVERSX_API_URL is not defined');
    }
    this.provider = new ProxyNetworkProvider(apiUrl);
    
    // Test the connection
    try {
      const networkConfig = await this.provider.getNetworkConfig();
      this.logger.log(`Connected to MultiversX network: ${networkConfig.ChainID}`);
      
      // Start monitoring for transactions
      this.setupTransactionMonitoring();
      
      // Load monitored contracts from cache or database
      await this.loadMonitoredContracts();
    } catch (error) {
      this.logger.error(`Failed to connect to MultiversX API: ${error.message}`);
    }
  }

  /**
   * Setup WebSocket connection to listen for new transactions
   */
  private setupTransactionMonitoring() {
    const wsUrl = this.configService.get<string>('MULTIVERSX_WS_URL');
    
    // Connect to WebSocket for real-time transaction updates
    this.wsConnection = new WebSocket(wsUrl);
    
    this.wsConnection.on('open', () => {
      this.isConnected = true;
      this.logger.log('Connected to MultiversX WebSocket');
      
      // Subscribe to transaction events
      const subscribeMessage = JSON.stringify({
        action: 'subscribe',
        topic: 'transactions'
      });
      this.wsConnection.send(subscribeMessage);
    });
    
    this.wsConnection.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Process transaction event
        if (message.type === 'transaction') {
          await this.processTransactionEvent(message.data);
        }
      } catch (error) {
        this.logger.error(`Error processing WebSocket message: ${error.message}`);
      }
    });
    
    this.wsConnection.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error.message}`);
      this.isConnected = false;
    });
    
    this.wsConnection.on('close', () => {
      this.logger.warn('WebSocket connection closed, attempting to reconnect in 5s...');
      this.isConnected = false;
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        this.setupTransactionMonitoring();
      }, 5000);
    });
  }

  /**
   * Process a transaction event from the WebSocket
   */
  private async processTransactionEvent(transactionData: any) {
    try {
      // Check if this transaction involves a monitored contract
      const receiver = transactionData.receiver;
      
      if (!this.monitoredContracts.has(receiver)) {
        return; // Not a monitored contract
      }
      
      // Get full transaction details
      const txHash = new TransactionHash(transactionData.txHash);
      const transaction = await this.getTransaction(txHash);
      
      if (!transaction) {
        return;
      }
      
      // Get contract code if available (for deeper analysis)
      const contractAddress = new Address(receiver);
      const contractCode = await this.getContractCode(contractAddress);
      
      // Analyze transaction for security issues
      const analysisResult = this.securityDetector.analyzeTransaction(
        new Transaction({
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
          chainID: (transaction as any).chainID || (await this.provider.getNetworkConfig()).ChainID, // Ensure chainID is correctly accessed
          // version: transaction.version,
        }),
        contractCode ?? undefined
      );
      
      // If issues found, create an alert
      if (analysisResult.matchedPatterns.length > 0 || analysisResult.isAnomaly) {
        await this.alertService.createAlert({
          contractAddress: receiver,
          transactionHash: transactionData.txHash,
          riskScore: analysisResult.riskScore,
          details: analysisResult.details,
          timestamp: new Date(),
          patternIds: analysisResult.matchedPatterns.map(p => p.id)
        });
        
        this.logger.warn(
          `Security issue detected in contract ${receiver}, tx: ${transactionData.txHash}`
        );
      }
    } catch (error) {
      this.logger.error(`Error processing transaction: ${error.message}`);
    }
  }

  /**
   * Create an Address object from string
   */
  createAddress(address: string): Address {
    try {
      return new Address(address);
    } catch (error) {
      this.logger.error(`Invalid address format: ${address}`);
      throw new Error(`Invalid address format: ${address}`);
    }
  }

  /**
   * Create a TransactionHash object from string
   */
  createTransactionHash(hash: string): TransactionHash {
    try {
      return new TransactionHash(hash);
    } catch (error) {
      this.logger.error(`Invalid transaction hash format: ${hash}`);
      throw new Error(`Invalid transaction hash format: ${hash}`);
    }
  }

  /**
   * Get transaction by hash string
   */
  async getTransaction(txHash: string | TransactionHash): Promise<TransactionOnNetwork | null> {
    // Convert string to TransactionHash if needed
    const transactionHash = typeof txHash === 'string' ? this.createTransactionHash(txHash) : txHash;
    try {
      // Try to get from cache first
      const cacheKey = `transaction:${transactionHash.toString()}`;
      const cachedTx = await this.cacheService.getLocal<Transaction>(cacheKey);
      
      if (cachedTx) {
        return cachedTx as unknown as TransactionOnNetwork;
      }
      
      // Fetch from API if not in cache
      const transaction = await this.provider.getTransaction(transactionHash.toString()) as TransactionOnNetwork;
      
      // Cache for 5 minutes
      await this.cacheService.setLocal(cacheKey, transaction, 300);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error fetching transaction ${transactionHash.toString()}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get smart contract code
   */
  async getContractCode(address: Address): Promise<string | null> {
    try {
      // Try to get from cache first
      const cacheKey = `contract:code:${address.toString()}`;
      const cachedCode = await this.cacheService.getLocal<string>(cacheKey);
      
      if (cachedCode) {
        return cachedCode;
      }
      
      // Fetch from API if not in cache
      const account = await this.provider.getAccount(address) as AccountOnNetwork;
      const code = account.code;
      
      // Cache for 1 hour (since contract code rarely changes)
      await this.cacheService.setLocal(cacheKey, code, 3600);
      
      return code;
    } catch (error) {
      this.logger.error(`Error fetching contract code for ${address.toString()}: ${error.message}`);
      return null;
    }
  }

  /**
   * Add a contract to the monitoring list
   */
  async addContractToMonitor(contractAddress: string): Promise<boolean> {
    try {
      // Validate contract address
      const address = new Address(contractAddress);
      
      // Verify that this is a valid contract
      const account = await this.provider.getAccount(address);
      const isContract = account.code && account.code.length > 0;
      
      if (!isContract) {
        this.logger.warn(`Address ${contractAddress} is not a contract`);
        return false;
      }
      
      // Add to monitored set
      this.monitoredContracts.add(contractAddress);
      
      // Save updated list to cache
      await this.saveMonitoredContracts();
      
      this.logger.log(`Added contract ${contractAddress} to monitoring list`);
      return true;
    } catch (error) {
      this.logger.error(`Error adding contract to monitor: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove a contract from the monitoring list
   */
  async removeContractFromMonitor(contractAddress: string): Promise<boolean> {
    const removed = this.monitoredContracts.delete(contractAddress);
    
    if (removed) {
      // Save updated list to cache
      await this.saveMonitoredContracts();
      this.logger.log(`Removed contract ${contractAddress} from monitoring list`);
    }
    
    return removed;
  }

  /**
   * Get list of monitored contracts
   */
  getMonitoredContracts(): string[] {
    return Array.from(this.monitoredContracts);
  }

  /**
   * Load monitored contracts from cache
   */
  private async loadMonitoredContracts(): Promise<void> {
    try {
      const contracts = await this.cacheService.getLocal<string[]>('monitored:contracts');
      
      if (contracts && Array.isArray(contracts)) {
        contracts.forEach(address => this.monitoredContracts.add(address));
        this.logger.log(`Loaded ${contracts.length} contracts to monitor`);
      }
    } catch (error) {
      this.logger.error(`Error loading monitored contracts: ${error.message}`);
    }
  }

  /**
   * Save monitored contracts to cache
   */
  private async saveMonitoredContracts(): Promise<void> {
    try {
      const contracts = Array.from(this.monitoredContracts);
      await this.cacheService.setLocal('monitored:contracts', contracts, 0); // No expiration
    } catch (error) {
      this.logger.error(`Error saving monitored contracts: ${error.message}`);
    }
  }
}