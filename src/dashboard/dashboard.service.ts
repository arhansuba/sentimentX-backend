import { Injectable } from '@nestjs/common';
// Import the correct module for ProxyProvider
import { ApiNetworkProvider, NetworkStatus } from '@multiversx/sdk-network-providers';
import { AlertService } from '../alert/alert.service'; // Assume exists
import { ContractService } from '../contract/contract.service'; // Assume exists

interface ExtendedNetworkStatus extends NetworkStatus {
  numTransactions: number;
}

@Injectable()
export class DashboardService {
  private readonly proxy: ApiNetworkProvider;

  constructor(
    private readonly alertService: AlertService,
    private readonly contractService: ContractService,
  ) {
    this.proxy = new ApiNetworkProvider('https://devnet-gateway.multiversx.com'); // Use Mainnet/Testnet as needed
  }

  async getDashboardStats() {
    // Fetch contracts monitored
    const contracts = await this.contractService.getContracts();
    const contractsMonitored = contracts.length;
    const contractsAtRisk = contracts.filter(c => c.securityScore < 60).length;

    // Fetch alerts
    const alertStats = await this.alertService.getAlertStats();
    const activeAlerts = alertStats.openAlerts;
    const resolvedAlerts = alertStats.totalAlerts - activeAlerts;

    // Fetch transactions monitored (example using MultiversX)
    const networkStats = await this.proxy.getNetworkStatus();
    const transactionsMonitored = (networkStats as ExtendedNetworkStatus).numTransactions; // Correct property access with type assertion

    // Anomalies detected via alerts
    const anomaliesDetected = alertStats.highRiskAlerts;

    // Average security score
    const securityScore = contracts.length
      ? Math.round(contracts.reduce((sum, c) => sum + c.securityScore, 0) / contracts.length)
      : 0;

    return {
      contractsMonitored,
      contractsAtRisk,
      activeAlerts,
      resolvedAlerts,
      transactionsMonitored,
      anomaliesDetected,
      securityScore,
    };
  }
}
