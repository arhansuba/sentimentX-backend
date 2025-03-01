import { Controller, Post, Body, Get, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { GeminiService } from '../ai/gemini-service';
import { BlockchainService } from '../services/blockchain.service';
import { Transaction } from '@multiversx/sdk-core/out/transaction';

class AnalyzeContractDto {
  contractAddress: string;
  contractCode?: string;
}

class AnalyzeTransactionDto {
  transactionHash: string;
}

@ApiTags('ai-analysis')
@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly blockchainService: BlockchainService,
  ) {}
  
  @Post('contract')
  @ApiOperation({ summary: 'Analyze a smart contract with AI' })
  @ApiBody({ type: AnalyzeContractDto })
  @ApiResponse({ status: 200, description: 'Returns AI analysis of the contract' })
  @ApiResponse({ status: 400, description: 'Invalid contract address or code' })
  async analyzeContract(@Body() body: AnalyzeContractDto) {
    if (!body.contractAddress) {
      throw new BadRequestException('Contract address is required');
    }
    
    let contractCode = body.contractCode;
    
    // If code not provided, try to fetch it
    if (!contractCode) {
      try {
        // Convert string address to Address object
        const address = this.blockchainService.createAddress(body.contractAddress);
        
        const fetchedContractCode = await this.blockchainService.getContractCode(address);
        contractCode = fetchedContractCode !== null ? fetchedContractCode : undefined;
        
        if (!contractCode) {
          throw new NotFoundException(`Contract code not found for address ${body.contractAddress}`);
        }
      } catch (error) {
        throw new BadRequestException(`Failed to fetch contract code: ${error.message}`);
      }
    }
    
    // Call Gemini service for analysis
    const analysis = await this.geminiService.analyzeSmartContract(
      body.contractAddress,
      contractCode
    );
    
    if (!analysis) {
      throw new BadRequestException('AI analysis failed. Please try again later.');
    }
    
    return {
      contractAddress: body.contractAddress,
      analysis
    };
  }
  
  @Post('transaction')
  @ApiOperation({ summary: 'Analyze a transaction with AI' })
  @ApiBody({ type: AnalyzeTransactionDto })
  @ApiResponse({ status: 200, description: 'Returns AI analysis of the transaction' })
  @ApiResponse({ status: 400, description: 'Invalid transaction hash' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async analyzeTransaction(@Body() body: AnalyzeTransactionDto) {
    if (!body.transactionHash) {
      throw new BadRequestException('Transaction hash is required');
    }
    
    // Get the transaction
    const transaction = await this.blockchainService.getTransaction(body.transactionHash);
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${body.transactionHash} not found`);
    }
    
    // Get contract code if this is a contract interaction
    let contractCode: string | null = null;
    const receiverAddress = transaction.receiver;
    try {
      const address = this.blockchainService.createAddress(receiverAddress.toString());
      contractCode = await this.blockchainService.getContractCode(address);
    } catch (error) {
      // We'll continue even if we can't get the contract code
      this.geminiService.logWarning(`Failed to fetch contract code: ${error.message}`);
    }
    
    // Call Gemini service for analysis
    const convertedTransaction = {
      getHash: () => transaction.hash,
      getSender: () => transaction.sender,
      getReceiver: () => transaction.receiver,
      getValue: () => transaction.value,
      getData: () => transaction.data,
      getGasLimit: () => transaction.gasLimit,
      getGasPrice: () => transaction.gasPrice,
      // Add other necessary properties and methods here
    } as unknown as Transaction;

    const analysis = await this.geminiService.analyzeTransaction(convertedTransaction, contractCode ?? undefined);
    
    if (!analysis) {
      throw new BadRequestException('AI analysis failed. Please try again later.');
    }
    
    return {
      transactionHash: body.transactionHash,
      sender: transaction.sender.toString(),
      receiver: receiverAddress.toString(),
      analysis
    };
  }
  
  @Get('health')
  @ApiOperation({ summary: 'Check AI service health' })
  @ApiResponse({ status: 200, description: 'Returns AI service status' })
  async getAiHealth() {
    return {
      status: 'operational',
      aiProvider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      timestamp: new Date()
    };
  }

  @Get()
  getAnalysis() {
    return { message: 'AI Analysis data' };
  }
}