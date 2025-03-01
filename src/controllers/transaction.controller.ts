import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent analyzed transactions' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of transactions to return' })
  @ApiResponse({ status: 200, description: 'Returns list of recent analyzed transactions' })
  async getRecentTransactions(@Query('limit') limit: number = 50) {
    const transactions = this.transactionService.getRecentTransactions(limit);
    
    return { 
      totalTransactions: transactions.length,
      transactions 
    };
  }

  @Get('high-risk')
  @ApiOperation({ summary: 'Get high-risk transactions' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum risk score (default: 50)' })
  @ApiResponse({ status: 200, description: 'Returns list of high-risk transactions' })
  async getHighRiskTransactions(@Query('minScore') minScore: number = 50) {
    const transactions = this.transactionService.getHighRiskTransactions(minScore);
    
    return { 
      totalTransactions: transactions.length,
      transactions 
    };
  }

  @Get(':hash')
  @ApiOperation({ summary: 'Get analysis for a specific transaction' })
  @ApiParam({ name: 'hash', description: 'Transaction hash' })
  @ApiResponse({ status: 200, description: 'Returns transaction analysis' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionAnalysis(@Param('hash') hash: string) {
    const analysis = await this.transactionService.getTransactionAnalysis(hash);
    
    if (!analysis) {
      throw new NotFoundException(`Transaction with hash ${hash} not found or could not be analyzed`);
    }
    
    return analysis;
  }

  @Get('contract/:address')
  @ApiOperation({ summary: 'Get transactions for a specific contract' })
  @ApiParam({ name: 'address', description: 'Contract address' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of transactions to return' })
  @ApiResponse({ status: 200, description: 'Returns transactions for the contract' })
  async getContractTransactions(
    @Param('address') address: string,
    @Query('limit') limit: number = 20
  ) {
    const transactions = this.transactionService.getTransactionsByContract(address, limit);
    
    return { 
      contractAddress: address,
      totalTransactions: transactions.length,
      transactions 
    };
  }
}