import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyNetworkProvider, TransactionOnNetwork, AccountOnNetwork, NetworkConfig } from '@multiversx/sdk-network-providers/out';
import { Transaction, Address, TransactionHash, TransactionPayload } from '@multiversx/sdk-core/out'; // Import TransactionPayload
import { SecurityDetector } from '../ai/detector';
import { AlertService } from './alert.service';
import { CacheService } from './cache.service';
import { MultiversXConfig } from 'src/config/multiversx.config';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out'; // Import ApiNetworkProvider

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ProxyNetworkProvider;
  private monitoredContracts: Set<string> = new Set();
  private lastCheckedTimestamp: number = Date.now(); // Track last poll time
  private lastProcessedTxHashes: Map<string, string> = new Map();

  constructor(
    private readonly securityDetector: SecurityDetector,
    private readonly alertService: AlertService,
    private readonly cacheService: CacheService,
    private readonly multiversXConfig: MultiversXConfig // Add MultiversXConfig to constructor
  ) {}

  async onModuleInit() {
    // Initialize the provider using MultiversXConfig with retry mechanism
    await this.connectToMultiversX();
  }

  private async connectToMultiversX() {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        this.provider = this.multiversXConfig.getProxyProvider();
        const networkConfig = await this.provider.getNetworkConfig();
        this.logger.log(`Connected to MultiversX network: ${networkConfig.ChainID}`);
        
        // Start monitoring for transactions
        this.startTransactionPolling(); // Start polling instead of WebSocket
        
        // Load monitored contracts from cache or database
        await this.loadMonitoredContracts();
        return; // Success, exit the loop
      } catch (error) {
        this.logger.error(`Attempt ${retries + 1} failed: ${error.message}`);
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    this.logger.error('Failed to connect to MultiversX API after retries');
  }

  async getNetworkConfigWithRetry(maxRetries = 3): Promise<any> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const config = await this.provider.getNetworkConfig();
        this.logger.log('Connected to MultiversX API:', config);
        return config;
      } catch (error) {
        retries++;
        this.logger.error(`Attempt ${retries} failed: ${error.message}`);
        if (retries === maxRetries) {
          throw new Error('Failed to connect to MultiversX API after retries');
        }
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    try {
      return await this.provider.getNetworkConfig();
    } catch (error) {
      this.logger.error(`Error fetching network config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start polling for new transactions
   */
  private startTransactionPolling() {
    const pollInterval = 10000; // Poll every 10 seconds
    setInterval(async () => {
      try {
        await this.pollTransactions();
      } catch (error) {
        this.logger.error(`Error polling transactions: ${error.message}`);
      }
    }, pollInterval);
    this.logger.log(`Started transaction polling every ${pollInterval / 1000} seconds`);
  }

  /**
   * Poll recent transactions for monitored contracts
   */
  private async pollTransactions() {
    const contracts = Array.from(this.monitoredContracts);
    this.logger.log(`Polling ${contracts.length} contracts: ${contracts.join(', ')}`);
    if (contracts.length === 0) return;

    for (const address of contracts) {
      try {
        // Note: MultiversX doesn't provide a direct "recent transactions" endpoint.
        // We'll simulate this by checking a contract's latest activity via account nonce or custom logic.
        // For a real implementation, you’d need an API endpoint or indexer service.

        // Example: Fetch account details to detect activity (simplified)
        const txHash = await this.fetchLatestTransaction(address); // Placeholder for actual logic
        
        if (txHash) {
          const transaction = await this.getTransaction(txHash);
          if (transaction) {
            await this.processTransactionEvent({
              txHash: txHash.toString(),
              receiver: address,
              // Add other necessary fields based on your transaction data
            });
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between requests
      } catch (error) {
        this.logger.error(`Error polling contract ${address}: ${error.message}`);
      }
    }
    this.lastCheckedTimestamp = Date.now();
  }

  /**
   * Fetch the latest transaction hash using an external indexer
   */
  private async fetchLatestTransaction(address: string): Promise<TransactionHash | null> {
    try {
      const apiProvider = this.multiversXConfig.getApiProvider();
      const transactions = await apiProvider.doGetGeneric(`address/${address}/transactions?size=1`);
      if (transactions && transactions.length > 0) {
        const txHash = transactions[0].txHash;
        const lastTxHash = this.lastProcessedTxHashes.get(address);
        if (txHash !== lastTxHash) {
          this.logger.log(`Fetched new transaction ${txHash} for ${address}`);
          this.lastProcessedTxHashes.set(address, txHash);
          return new TransactionHash(txHash);
        }
        this.logger.debug(`No new transactions for ${address}`);
        return null;
      }
      this.logger.debug(`No transactions found for ${address}`);
      return null;
    } catch (error) {
      this.logger.error(`Error fetching latest transaction for ${address}: ${error.message}`);
      return null;
    }
  }

  /**
   * Process a transaction event
   */
  private async processTransactionEvent(transactionData: any) {
    try {
      const receiver = transactionData.receiver;
      if (!this.monitoredContracts.has(receiver)) return;

      const txHash = new TransactionHash(transactionData.txHash);
      const transactionOnNetwork = await this.getTransaction(txHash);
      if (!transactionOnNetwork) return;

      const contractAddress = new Address(receiver);
      const contractCode = await this.getContractCode(contractAddress);

      // Convert TransactionOnNetwork to Transaction
      const networkConfig = await this.provider.getNetworkConfig();
      const transaction = new Transaction({
        nonce: transactionOnNetwork.nonce,
        value: transactionOnNetwork.value.toString(),
        sender: new Address(transactionOnNetwork.sender.bech32()),
        receiver: new Address(transactionOnNetwork.receiver.bech32()),
        gasPrice: transactionOnNetwork.gasPrice,
        gasLimit: transactionOnNetwork.gasLimit,
        data: new TransactionPayload(transactionOnNetwork.data.toString()), // Convert string to TransactionPayload
        chainID: networkConfig.ChainID,
        version: 1, // Default version; adjust if needed
      });

      if (contractCode !== null) {
        const analysisResult = this.securityDetector.analyzeTransaction(transaction, contractCode);
        if (analysisResult.matchedPatterns.length > 0 || analysisResult.isAnomaly) {
          await this.alertService.createAlert({
            contractAddress: receiver,
            transactionHash: transactionData.txHash,
            riskScore: analysisResult.riskScore,
            details: analysisResult.details,
            timestamp: new Date(),
            patternIds: analysisResult.matchedPatterns.map(p => p.id),
          });
          this.logger.warn(`Security issue detected in contract ${receiver}, tx: ${transactionData.txHash}`);
        }
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