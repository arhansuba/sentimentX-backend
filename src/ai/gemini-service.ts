import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResult,
} from '@google/generative-ai';
import { Transaction } from '@multiversx/sdk-core/out';
import { AppConfig } from '../config/app.config';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private aiAnalysisEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly appConfig: AppConfig,
  ) {
    this.aiAnalysisEnabled = this.appConfig.aiAnalysisEnabled;

    if (!this.aiAnalysisEnabled) {
      this.logger.warn(
        'AI analysis is disabled by configuration. Skipping AI initialization.',
      );
      return;
    }

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set. AI analysis will be limited.',
      );
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.appConfig.geminiModel,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    this.logger.log('Gemini AI service initialized');
  }

  /**
   * Logs a warning message
   * @param message The warning message to log
   */
  logWarning(message: string) {
    this.logger.warn(message);
  }

  /**
   * Analyzes a transaction using Gemini AI
   * @param transaction The transaction to analyze
   * @param contractCode Optional contract code for more in-depth analysis
   * @returns Analysis results from Gemini
   */
  async analyzeTransaction(
    transaction: Transaction,
    contractCode?: string,
  ): Promise<any | null> {
    if (!this.aiAnalysisEnabled || !this.model) {
      this.logger.warn(
        'Gemini API not initialized or AI analysis disabled. Skipping AI analysis.',
      );
      return null;
    }

    try {
      // Prepare transaction data for Gemini
      const txData = {
        hash: transaction.getHash().toString(),
        sender: transaction.getSender().toString(),
        receiver: transaction.getReceiver().toString(),
        value: transaction.getValue().toString(),
        data: transaction.getData().toString(),
        gasLimit: transaction.getGasLimit().toString(),
        gasPrice: transaction.getGasPrice().toString(),
      };

      // Create prompt for Gemini
      const prompt = `
        As a blockchain security expert, analyze this MultiversX blockchain transaction for potential security vulnerabilities:

        TRANSACTION DETAILS:
        ${JSON.stringify(txData, null, 2)}

        ${contractCode ? `\nCONTRACT CODE:\n${contractCode}` : ''}

        Identify any suspicious patterns like:
        1. Reentrancy attack patterns
        2. Flash loan attack patterns
        3. Integer overflow/underflow vulnerabilities
        4. Access control issues
        5. Suspicious token transfers
        6. Low gas griefing
        7. Timestamp dependence

        For each issue found, provide:
        - Vulnerability type
        - Risk level (critical, high, medium, low)
        - Brief explanation of the concern
        - Recommendation

        Return your analysis in the following JSON format:
        {
          "vulnerabilities": [
            {
              "type": "vulnerability_type",
              "risk_level": "risk_level",
              "explanation": "explanation",
              "recommendation": "recommendation"
            }
          ],
          "is_anomaly": true/false,
          "risk_score": 0-100,
          "summary": "brief summary"
        }

        If no issues are found, return an empty vulnerabilities array.
      `;

      // Generate content using Gemini API
      const result: GenerateContentResult = await this.model.generateContent(
        prompt,
      );
      const responseText = result.response.text();

      // Parse the JSON response
      try {
        // Extract JSON object from response text - the model sometimes adds extra text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return analysis;
        } else {
          this.logger.warn(
            `Failed to extract JSON from Gemini response. Full response: ${responseText}`,
          );
          return null;
        }
      } catch (parseError) {
        this.logger.error(
          `Failed to parse Gemini response as JSON: ${parseError.message}. Full response: ${responseText}`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(`Error calling Gemini API: ${error.message}`);
      return null;
    }
  }

  /**
   * Analyzes a smart contract code for potential vulnerabilities
   * @param contractAddress The contract address
   * @param contractCode The contract code to analyze
   * @returns Analysis results from Gemini
   */
  async analyzeSmartContract(
    contractAddress: string,
    contractCode: string,
  ): Promise<any | null> {
    if (!this.aiAnalysisEnabled || !this.model) {
      this.logger.warn(
        'Gemini API not initialized or AI analysis is disabled. Skipping AI analysis.',
      );
      return null;
    }

    try {
      // Create prompt for Gemini
      const prompt = `
        As a blockchain security expert, analyze this MultiversX smart contract code for potential security vulnerabilities:

        CONTRACT ADDRESS: ${contractAddress}

        CONTRACT CODE:
        ${contractCode}

        Identify any security issues like:
        1. Reentrancy vulnerabilities
        2. Integer overflow/underflow vulnerabilities
        3. Access control issues
        4. Improper input validation
        5. Exposed sensitive functions
        6. Resource exhaustion vulnerabilities
        7. Logic flaws

        For each issue found, provide:
        - Vulnerability type
        - Risk level (critical, high, medium, low)
        - Specific code location
        - Brief explanation of the concern
        - Recommendation to fix

        Return your analysis in the following JSON format:
        {
          "vulnerabilities": [
            {
              "type": "vulnerability_type",
              "risk_level": "risk_level",
              "location": "specific function or line",
              "explanation": "explanation",
              "recommendation": "recommendation"
            }
          ],
          "risk_score": 0-100,
          "overall_assessment": "brief overall assessment"
        }

        If no issues are found, return an empty vulnerabilities array.
      `;

      // Generate content using Gemini API
      const generationConfig = {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const responseText = result.response.text();

      // Parse the JSON response
      try {
        // Extract JSON object from response text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return analysis;
        } else {
          this.logger.warn(
            `Failed to extract JSON from Gemini response. Full response: ${responseText}`,
          );
          return null;
        }
      } catch (parseError) {
        this.logger.error(
          `Failed to parse Gemini response as JSON: ${parseError.message}. Full response: ${responseText}`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(`Error calling Gemini API: ${error.message}`);
      return null;
    }
  }
}
