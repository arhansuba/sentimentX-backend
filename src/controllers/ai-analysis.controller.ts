import { Controller, Post, Body, Get, Param, NotFoundException, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { GeminiService } from '../ai/gemini-service';
import { BlockchainService } from '../services/blockchain.service';
import { Transaction } from '@multiversx/sdk-core/out';
import { FileInterceptor } from '@nestjs/platform-express';
import { SecurityDetector } from '../ai/detector';
import { ContractService } from '../services/contract.service';
import { AlertService } from '../services/alert.service';
import { Multer } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// DTOs
class AnalyzeContractDto {
  contractAddress: string;
  contractCode?: string;
}

class AnalyzeTransactionDto {
  transactionHash: string;
}

interface UpdateContractDto {
  securityScore?: number;
  lastAnalyzed?: Date;
  fileName?: string;
}

import { Contract } from '../entities/contract.entity';

interface AnalysisResult {
  securityScore: number;
  anomalies: {
    severity: string;
    patternId: string;
    description: string;
    lines: number[];
    impact: string;
    recommendation: string;
  }[];
}

@ApiTags('ai-analysis')
@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly blockchainService: BlockchainService,
    private readonly securityDetector: SecurityDetector,
    private readonly contractService: ContractService,
    private readonly alertService: AlertService,
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

    if (!contractCode) {
      try {
        const address = this.blockchainService.createAddress(body.contractAddress);
        const fetchedContractCode = await this.blockchainService.getContractCode(address);

        if (fetchedContractCode === null) {
          throw new NotFoundException(`Contract code not found for address ${body.contractAddress}`);
        }
        contractCode = fetchedContractCode;
      } catch (error) {
        throw new BadRequestException(`Failed to fetch contract code: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const analysis = await this.geminiService.analyzeSmartContract(body.contractAddress, contractCode);

    if (!analysis) {
      throw new BadRequestException('AI analysis failed. Please try again later.');
    }

    return {
      contractAddress: body.contractAddress,
      analysis,
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

    const transaction = await this.blockchainService.getTransaction(body.transactionHash);

    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${body.transactionHash} not found`);
    }

    let contractCode: string | undefined = undefined;
    const receiverAddress = transaction.receiver;
    try {
      const address = this.blockchainService.createAddress(receiverAddress.toString());
      const fetchedCode = await this.blockchainService.getContractCode(address);
      if (fetchedCode !== null) {
        contractCode = fetchedCode;
      }
    } catch (error) {
      this.geminiService.logWarning(`Failed to fetch contract code: ${error instanceof Error ? error.message : String(error)}`);
    }

    const convertedTransaction = transaction as unknown as Transaction; // Assuming transaction matches Transaction type

    const analysis = await this.geminiService.analyzeTransaction(convertedTransaction, contractCode);

    if (!analysis) {
      throw new BadRequestException('AI analysis failed. Please try again later.');
    }

    return {
      transactionHash: body.transactionHash,
      sender: transaction.sender.toString(),
      receiver: receiverAddress.toString(),
      analysis,
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
      timestamp: new Date(),
    };
  }

  @Get()
  getAnalysis() {
    return { message: 'AI Analysis data' };
  }

  @Post('analyze-code')
  async analyzeCode(@Body() body: { contractId: string; code: string; fileName: string }) {
    const { contractId, code, fileName } = body;

    const contract: Contract = await this.contractService.findOne(contractId);
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const analysis: AnalysisResult = await this.securityDetector.analyzeContract(contractId, code, fileName);

    await this.contractService.update(contractId, {
      securityScore: analysis.securityScore,
      lastAnalyzed: new Date(),
      //fileName,
    });

    const alertPromises = analysis.anomalies.map(anomaly =>
      this.alertService.create({
        contractId,
        type: anomaly.severity,
        title: `${anomaly.severity} Vulnerability: ${anomaly.patternId}`,
        description: anomaly.description,
        lines: anomaly.lines,
        impact: anomaly.impact,
        recommendation: anomaly.recommendation,
        timestamp: new Date(),
      })
    );
    await Promise.all(alertPromises);

    return analysis;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndAnalyze(@UploadedFile() file: Multer.File, @Body() body: { contractId: string }) {
    const { contractId } = body;

    const contract: Contract = await this.contractService.findOne(contractId);
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const tempDir = path.join(os.tmpdir(), 'sentinel-contracts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, file.originalname);
    fs.writeFileSync(filePath, file.buffer);

    try {
      const analysis: AnalysisResult = await this.securityDetector.analyzeContractFile(contractId, filePath);

      await this.contractService.update(contractId, {
        securityScore: analysis.securityScore,
        lastAnalyzed: new Date(),
        //fileName: file.originalname,
      });

      const alertPromises = analysis.anomalies.map(anomaly =>
        this.alertService.create({
          contractId,
          type: anomaly.severity,
          title: `${anomaly.severity} Vulnerability: ${anomaly.patternId}`,
          description: anomaly.description,
          lines: anomaly.lines,
          impact: anomaly.impact,
          recommendation: anomaly.recommendation,
          timestamp: new Date(),
        })
      );
      await Promise.all(alertPromises);

      return analysis;
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error cleaning up temporary file:', error);
      }
    }
  }

  @Get(':contractId')
  async getLatestAnalysis(@Param('contractId') contractId: string) {
    const contract: Contract = await this.contractService.findOne(contractId);
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const alerts = await this.alertService.findByContractId(contractId);

    return {
      contractId,
      securityScore: contract.securityScore,
      lastAnalyzed: contract.lastAnalyzedAt,
      alerts,
    };
  }
}