import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@multiversx/sdk-core/out';
import { BasePatternDetector, VulnerabilityPattern } from '../models/pattern.model';

/**
 * Detector for flash loan attack vulnerabilities in MultiversX smart contracts
 * 
 * Flash loan attacks involve borrowing a large amount of assets without collateral,
 * manipulating the market or exploiting vulnerabilities, and repaying the loan in the same transaction.
 */
@Injectable()
export class FlashLoanDetector extends BasePatternDetector {
  private readonly logger = new Logger(FlashLoanDetector.name);

  /**
   * Pattern definition for flash loan attack vulnerabilities
   */
  readonly pattern: VulnerabilityPattern = {
    id: 'flash-loan-attack',
    name: 'Flash Loan Attack Pattern',
    description: 'Detects patterns consistent with flash loan attacks, where large sums are borrowed, used to manipulate markets or exploit vulnerabilities, and repaid in the same transaction.',
    severity: 'high',
    detector: this.detectFlashLoanPattern.bind(this),
  };

  /**
   * Analyzes a transaction and contract code for flash loan vulnerabilities
   * @param transaction The transaction to analyze
   * @param contractCode The contract code if available
   * @returns True if flash loan attack patterns are detected
   */
  private detectFlashLoanPattern(transaction: Transaction, contractCode?: string): boolean {
    try {
      // Check for unusually large value in the transaction
      const value = this.getTransactionValue(transaction);
      const data = this.getTransactionData(transaction);
      
      // Look for suspicious keywords in the transaction data
      const hasFlashLoanKeywords = this.checkForFlashLoanKeywords(data);
      
      // Check for complex transaction data (multiple operations in one transaction)
      const hasComplexData = this.checkForComplexData(data);
      
      // Check for price manipulation patterns
      const hasPriceManipulation = this.checkForPriceManipulation(data);
      
      // If contract code is available, perform deeper analysis
      if (contractCode) {
        return this.analyzeContractCode(contractCode) || 
               (value > 100000000000000000000 && (hasFlashLoanKeywords || hasComplexData || hasPriceManipulation));
      }
      
      // If value is very large and has suspicious data patterns, flag it
      return value > 100000000000000000000 && (hasFlashLoanKeywords || hasComplexData || hasPriceManipulation);
    } catch (error) {
      this.logger.error(`Error in flash loan detection: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for flash loan related keywords in transaction data
   * @param data Transaction data
   * @returns True if suspicious keywords are found
   */
  private checkForFlashLoanKeywords(data: string): boolean {
    const flashLoanKeywords = [
      'flash',
      'loan',
      'borrow',
      'lend',
      'liquidity',
      'swap',
      'arbitrage'
    ];
    
    return flashLoanKeywords.some(keyword => data.toLowerCase().includes(keyword));
  }

  /**
   * Check if transaction data is complex (multiple operations)
   * @param data Transaction data
   * @returns True if data appears complex
   */
  private checkForComplexData(data: string): boolean {
    // Count the number of function calls or operations
    const functionCalls = data.split('@').length - 1;
    
    // Multiple function calls in one transaction could indicate a flash loan attack
    return functionCalls > 3;
  }

  /**
   * Check for price manipulation patterns in transaction data
   * @param data Transaction data
   * @returns True if price manipulation patterns are detected
   */
  private checkForPriceManipulation(data: string): boolean {
    const priceManipulationKeywords = [
      'price',
      'oracle',
      'swap',
      'exchange',
      'slippage',
      'rate',
      'pool'
    ];
    
    // Check if there are multiple price-related operations
    let keywordCount = 0;
    for (const keyword of priceManipulationKeywords) {
      if (data.toLowerCase().includes(keyword)) {
        keywordCount++;
      }
    }
    
    return keywordCount >= 3; // If multiple price-related terms are found, it's suspicious
  }

  /**
   * Analyze contract code for flash loan vulnerabilities
   * @param contractCode The contract code to analyze
   * @returns True if flash loan vulnerability patterns are detected
   */
  private analyzeContractCode(contractCode: string): boolean {
    // Check for unsafe price oracle usage
    const unsafePriceOracle = this.checkUnsafePriceOracle(contractCode);
    
    // Check for missing flash loan protection
    const missingFlashLoanProtection = this.checkMissingFlashLoanProtection(contractCode);
    
    // Check for insufficient validation
    const insufficientValidation = this.checkInsufficientValidation(contractCode);
    
    return unsafePriceOracle || missingFlashLoanProtection || insufficientValidation;
  }

  /**
   * Check if the contract uses unsafe price oracles (vulnerable to manipulation)
   * @param contractCode The contract code
   * @returns True if unsafe price oracle usage is detected
   */
  private checkUnsafePriceOracle(contractCode: string): boolean {
    // Check for unsafe price source patterns
    const unsafePriceSources = [
      'getTokenPrice',
      'getExchangeRate',
      'calculatePrice',
      'price_oracle',
      'getPriceFromAmm',
      'get_price_from_pair'
    ];
    
    // Check if the contract uses unsafe price sources without time-weighted average
    return unsafePriceSources.some(source => 
      contractCode.includes(source) && 
      !contractCode.includes('time_weighted') && 
      !contractCode.includes('timeWeighted')
    );
  }

  /**
   * Check if the contract is missing flash loan protection
   * @param contractCode The contract code
   * @returns True if missing protection is detected
   */
  private checkMissingFlashLoanProtection(contractCode: string): boolean {
    // Check for price-dependent functions without flash loan protection
    const hasPriceDependentFunctions = [
      'liquidate',
      'borrow',
      'withdraw',
      'swap',
      'exchange'
    ].some(func => contractCode.includes(func));
    
    // Check for flash loan protection mechanisms
    const hasProtection = [
      'flash_loan_protection',
      'flashLoanProtection',
      'time_window',
      'timeWindow',
      'block_number',
      'blockNumber'
    ].some(protection => contractCode.includes(protection));
    
    return hasPriceDependentFunctions && !hasProtection;
  }

  /**
   * Check for insufficient validation in the contract
   * @param contractCode The contract code
   * @returns True if insufficient validation is detected
   */
  private checkInsufficientValidation(contractCode: string): boolean {
    // Check if the contract performs actions that depend on external input without sufficient validation
    const hasExternalInputDependence = 
      contractCode.includes('call_value') || 
      contractCode.includes('callValue') || 
      contractCode.includes('input_values') || 
      contractCode.includes('inputValues');
    
    // Check for validation patterns
    const hasValidation = 
      contractCode.includes('require!') || 
      contractCode.includes('assert!') || 
      contractCode.includes('verify!');
    
    return hasExternalInputDependence && !hasValidation;
  }

  /**
   * Get transaction value (amount being transferred)
   * @param transaction The transaction to analyze
   * @returns Numeric value of the transaction
   */
  private getTransactionValue(transaction: Transaction): number {
    try {
      return Number(transaction.getValue().toString());
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get decoded data from transaction
   * @param transaction The transaction to analyze
   * @returns Decoded data as string
   */
  private getTransactionData(transaction: Transaction): string {
    try {
      // Get data from transaction and convert from base64 if needed
      const rawData = transaction.getData().toString();
      
      // Try to decode if it looks like base64
      if (this.isBase64(rawData)) {
        return Buffer.from(rawData, 'base64').toString();
      }
      
      return rawData;
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if a string is base64 encoded
   * @param str The string to check
   * @returns True if the string is base64 encoded
   */
  private isBase64(str: string): boolean {
    const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
    return base64Regex.test(str);
  }

  /**
   * Get detailed explanation of the detected vulnerability
   * @param transaction Transaction that was analyzed
   * @param contractCode Contract code that was analyzed
   * @returns Human-readable explanation
   */
  getDetails(transaction: Transaction, contractCode?: string): string {
    let details = 'Potential flash loan attack vulnerability detected. ';
    
    const value = this.getTransactionValue(transaction);
    const data = this.getTransactionData(transaction);
    
    if (value > 100000000000000000000) {
      details += `The transaction involves a very large value (${value} wei), which is characteristic of flash loan attacks. `;
    }
    
    if (this.checkForFlashLoanKeywords(data)) {
      details += 'The transaction contains keywords often associated with flash loan operations. ';
    }
    
    if (this.checkForComplexData(data)) {
      details += 'The transaction involves multiple operations in a single call, typical of flash loan attacks. ';
    }
    
    if (this.checkForPriceManipulation(data)) {
      details += 'The transaction contains patterns suggesting price oracle manipulation. ';
    }
    
    if (contractCode) {
      if (this.checkUnsafePriceOracle(contractCode)) {
        details += 'The contract uses potentially unsafe price oracle mechanisms that could be manipulated in a flash loan attack. ';
      }
      
      if (this.checkMissingFlashLoanProtection(contractCode)) {
        details += 'The contract lacks explicit protections against flash loan attacks. ';
      }
      
      if (this.checkInsufficientValidation(contractCode)) {
        details += 'The contract has insufficient validation of external inputs, making it vulnerable to manipulation. ';
      }
    }
    
    return details;
  }

  /**
   * Get recommendations on how to fix flash loan vulnerabilities
   * @returns Human-readable recommendations
   */
  getRecommendations(): string {
    return 'To protect against flash loan attacks: ' +
           '1. Use time-weighted average price (TWAP) oracles instead of spot prices. ' +
           '2. Implement price impact guards to limit price manipulation. ' +
           '3. Add flash loan protections such as comparing prices across multiple sources. ' +
           '4. Consider adding a cooldown period between significant state-changing operations. ' +
           '5. Implement rate limiting or maximum transaction value limits. ' +
           '6. Thoroughly validate all external inputs before processing.';
  }
}