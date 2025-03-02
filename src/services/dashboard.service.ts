import { Injectable } from '@nestjs/common';
import { ApiNetworkProvider, NetworkStatus } from '@multiversx/sdk-network-providers';
import { AlertService } from '../alert/alert.service';
import { ContractService } from '../contract/contract.service';

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
    this.proxy = new ApiNetworkProvider('https://devnet-gateway.multiversx.com');
  }

  async getDashboardStats() {
    try {
      const contracts = await this.contractService.getContracts();
      const contractsMonitored = contracts.length;
      const contractsAtRisk = contracts.filter(c => c.securityScore < 60).length;

      const alertStats = await this.alertService.getAlertStats();
      const activeAlerts = alertStats.openAlerts;
      const resolvedAlerts = alertStats.totalAlerts - activeAlerts;

      const networkStats = await this.proxy.getNetworkStatus();
      const transactionsMonitored = (networkStats as ExtendedNetworkStatus).numTransactions;

      const anomaliesDetected = alertStats.highRiskAlerts;

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
    } catch (error) {
      console.error('DashboardService error:', error);
      throw error;
    }
  }
}
