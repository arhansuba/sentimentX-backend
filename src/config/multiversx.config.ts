import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NetworkConfig, ProxyNetworkProvider, ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';

/**
 * MultiversX blockchain configuration service
 * 
 * Provides centralized access to MultiversX configuration values and providers
 */
@Injectable()
export class MultiversXConfig {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get the MultiversX network (mainnet, testnet, devnet)
   */
  public get network(): string {
    return this.configService.get<string>('MULTIVERSX_NETWORK', 'devnet');
  }

  /**
   * Get the MultiversX API URL
   */
  public get apiUrl(): string {
    const custom = this.configService.get<string>('MULTIVERSX_API_URL');
    
    if (custom) {
      return custom;
    }
    
    switch (this.network) {
      case 'mainnet':
        return 'https://api.multiversx.com';
      case 'testnet':
        return 'https://testnet-api.multiversx.com';
      default:
        return 'https://devnet-api.multiversx.com';
    }
  }

  /**
   * Get the MultiversX Gateway URL
   */
  public get gatewayUrl(): string {
    const custom = this.configService.get<string>('MULTIVERSX_GATEWAY_URL');
    
    if (custom) {
      return custom;
    }
    
    switch (this.network) {
      case 'mainnet':
        return 'https://gateway.multiversx.com';
      case 'testnet':
        return 'https://testnet-gateway.multiversx.com';
      default:
        return 'https://devnet-gateway.multiversx.com';
    }
  }

  /**
   * Get the MultiversX Explorer URL
   */
  public get explorerUrl(): string {
    const custom = this.configService.get<string>('MULTIVERSX_EXPLORER_URL');
    
    if (custom) {
      return custom;
    }
    
    switch (this.network) {
      case 'mainnet':
        return 'https://explorer.multiversx.com';
      case 'testnet':
        return 'https://testnet-explorer.multiversx.com';
      default:
        return 'https://devnet-explorer.multiversx.com';
    }
  }

  /**
   * Get the MultiversX WebSocket URL
   */
  public get websocketUrl(): string {
    const custom = this.configService.get<string>('MULTIVERSX_WS_URL');
    
    if (custom) {
      return custom;
    }
    
    switch (this.network) {
      case 'mainnet':
        return 'wss://gateway.multiversx.com/websocket';
      case 'testnet':
        return 'wss://testnet-gateway.multiversx.com/websocket';
      default:
        return 'wss://devnet-gateway.multiversx.com/websocket';
    }
  }

  /**
   * Get a MultiversX proxy provider
   */
  public getProxyProvider(): ProxyNetworkProvider {
    return new ProxyNetworkProvider(this.gatewayUrl, {
      clientName: 'sentinel-backend', // Add a descriptive name for your app
    });
  }

  /**
   * Get a MultiversX API provider
   */
  public getApiProvider(): ApiNetworkProvider {
    return new ApiNetworkProvider(this.apiUrl, {
      clientName: 'sentinel-backend', // Add a descriptive name for your app
    });
  }

  /**
   * Get the default gas limit
   */
  public get defaultGasLimit(): number {
    return this.configService.get<number>('MULTIVERSX_DEFAULT_GAS_LIMIT', 50000);
  }

  /**
   * Get the default gas price
   */
  public get defaultGasPrice(): number {
    return this.configService.get<number>('MULTIVERSX_DEFAULT_GAS_PRICE', 1000000000);
  }

  /**
   * Get the MultiversX chain ID
   */
  public async getChainId(): Promise<string> {
    try {
      const provider = this.getProxyProvider();
      const networkConfig = await provider.getNetworkConfig();
      return networkConfig.ChainID;
    } catch (error) {
      // Fallback values if provider is not available
      switch (this.network) {
        case 'mainnet':
          return '1';
        case 'testnet':
          return 'T';
        default:
          return 'D';
      }
    }
  }

  /**
   * Get a link to view a transaction on the explorer
   */
  public getTransactionLink(txHash: string): string {
    return `${this.explorerUrl}/transactions/${txHash}`;
  }

  /**
   * Get a link to view an address on the explorer
   */
  public getAddressLink(address: string): string {
    return `${this.explorerUrl}/accounts/${address}`;
  }

  /**
   * Get a link to view a smart contract on the explorer
   */
  public getContractLink(address: string): string {
    return `${this.explorerUrl}/accounts/${address}/contracts`;
  }

  /**
   * Get a link to view a token on the explorer
   */
  public getTokenLink(identifier: string): string {
    return `${this.explorerUrl}/tokens/${identifier}`;
  }

  /**
   * Get the EGLD token name
   */
  public get egldToken(): string {
    return 'EGLD';
  }

  /**
   * Get the EGLD token decimals
   */
  public get egldDecimals(): number {
    return 18;
  }
}