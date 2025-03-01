import { Controller, Get, Post, Delete, Param, Body, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { BlockchainService } from '../services/blockchain.service';
import { TransactionService } from '../services/transaction.service';
import { AlertService } from '../services/alert.service';

class AddContractDto {
  contractAddress: string;
}

@ApiTags('contracts')
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionService: TransactionService,
    private readonly alertService: AlertService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all monitored contracts' })
  @ApiResponse({ status: 200, description: 'Returns list of all monitored contracts' })
  async getAllMonitoredContracts() {
    const contracts = this.blockchainService.getMonitoredContracts();
    return { contracts };
  }

  @Post()
  @ApiOperation({ summary: 'Add a contract to monitoring' })
  @ApiBody({ type: AddContractDto })
  @ApiResponse({ status: 201, description: 'Contract added to monitoring' })
  @ApiResponse({ status: 400, description: 'Invalid contract address' })
  async addContract(@Body() body: AddContractDto) {
    if (!body.contractAddress) {
      throw new BadRequestException('Contract address is required');
    }

    const success = await this.blockchainService.addContractToMonitor(body.contractAddress);
    
    if (!success) {
      throw new BadRequestException('Failed to add contract. Make sure it is a valid smart contract address.');
    }
    
    return { 
      success: true,
      message: `Contract ${body.contractAddress} is now being monitored`,
      contractAddress: body.contractAddress
    };
  }

  @Delete(':address')
  @ApiOperation({ summary: 'Remove a contract from monitoring' })
  @ApiParam({ name: 'address', description: 'Contract address to remove' })
  @ApiResponse({ status: 200, description: 'Contract removed from monitoring' })
  @ApiResponse({ status: 404, description: 'Contract not found in monitored list' })
  async removeContract(@Param('address') address: string) {
    const success = await this.blockchainService.removeContractFromMonitor(address);
    
    if (!success) {
      throw new NotFoundException(`Contract ${address} is not currently monitored`);
    }
    
    return { 
      success: true,
      message: `Contract ${address} removed from monitoring`,
      contractAddress: address
    };
  }

  @Get(':address/alerts')
  @ApiOperation({ summary: 'Get alerts for a specific contract' })
  @ApiParam({ name: 'address', description: 'Contract address' })
  @ApiResponse({ status: 200, description: 'Returns alerts for the specified contract' })
  async getContractAlerts(@Param('address') address: string) {
    const alerts = this.alertService.getAlertsByContract(address);
    return { 
      contractAddress: address,
      alerts
    };
  }

  @Get(':address/transactions')
  @ApiOperation({ summary: 'Get analyzed transactions for a specific contract' })
  @ApiParam({ name: 'address', description: 'Contract address' })
  @ApiResponse({ status: 200, description: 'Returns transactions for the specified contract' })
  async getContractTransactions(
    @Param('address') address: string,
    @Query('limit') limit: number = 20
  ) {
    const transactions = this.transactionService.getTransactionsByContract(address, limit);
    return { 
      contractAddress: address,
      transactions
    };
  }

  @Get(':address/health')
  @ApiOperation({ summary: 'Get security health overview for a contract' })
  @ApiParam({ name: 'address', description: 'Contract address' })
  @ApiResponse({ status: 200, description: 'Returns security health overview' })
  async getContractHealth(@Param('address') address: string) {
    const alerts = this.alertService.getAlertsByContract(address) as any[];
    const transactions = this.transactionService.getTransactionsByContract(address, 100) as any[];
    
    // Calculate security metrics
    const highRiskAlerts = alerts.filter(alert => 
      alert.riskScore.level === 'high' || alert.riskScore.level === 'critical'
    );
    
    const vulnerabilityCounts = {};
    alerts.forEach(alert => {
      alert.patternIds.forEach(patternId => {
        vulnerabilityCounts[patternId] = (vulnerabilityCounts[patternId] || 0) + 1;
      });
    });
    
    // Calculate average security score from transactions
    let avgSecurityScore = 0;
    if (transactions.length > 0) {
      avgSecurityScore = transactions.reduce((sum, tx) => sum + tx.securityScore, 0) / transactions.length;
    }
    
    return {
      contractAddress: address,
      securityHealth: {
        totalAlerts: alerts.length,
        openAlerts: alerts.filter(a => !a.resolved).length,
        highRiskAlerts: highRiskAlerts.length,
        analyzedTransactions: transactions.length,
        averageSecurityScore: avgSecurityScore.toFixed(2),
        topVulnerabilities: Object.entries(vulnerabilityCounts)
          .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, count]) => ({ id, count })),
        lastAlertTimestamp: alerts.length > 0 ? 
          alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp : null
      }
    };
  }
}