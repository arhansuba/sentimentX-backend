import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@multiversx/sdk-core/out';
import { BasePatternDetector, VulnerabilityPattern } from '../models/pattern.model';
import { GeminiService } from '../gemini-service';

/**
 * Detector for integer overflow/underflow vulnerabilities in MultiversX smart contracts
 * 
 * Integer overflow/underflow happens when an arithmetic operation attempts to
 * create a numeric value that is outside the range that can be represented with
 * the allocated number of bits.
 */
@Injectable()
export class OverflowDetector extends BasePatternDetector {
  private readonly logger = new Logger(OverflowDetector.name);
  constructor(private readonly geminiService: GeminiService) {
    super();
  }

  /**
   * Pattern definition for integer overflow/underflow vulnerabilities
   */
  readonly pattern: VulnerabilityPattern = {
    id: 'integer-overflow',
    name: 'Integer Overflow/Underflow',
    description: 'Detects potential integer overflow or underflow vulnerabilities, where arithmetic operations can wrap around due to fixed-size integer types.',
    severity: 'high',
    detector: this.detectOverflowPattern.bind(this),
    category: ''
  };

  /**
   * Analyzes a transaction and contract code for integer overflow/underflow vulnerabilities
   * @param transaction The transaction to analyze
   * @param contractCode The contract code if available
   * @returns True if overflow/underflow patterns are detected
   */
  private detectOverflowPattern(transaction: Transaction, contractCode?: string): boolean {
    try {
      // Check transaction data for patterns indicating potential overflow/underflow
      const data = this.getTransactionData(transaction);
      
      // Look for suspicious arithmetic operations in transaction data
      const hasArithmeticOperations = this.checkForArithmeticOperations(data);
      
      // If contract code is available, perform deeper analysis
      if (contractCode) {
        return this.analyzeContractCode(contractCode) || hasArithmeticOperations;
      }
      
      return hasArithmeticOperations;
    } catch (error) {
      this.logger.error(`Error in overflow detection: ${error.message}`);
      return false;
    }
  }

  /**
   * Analyze smart contract code for overflow/underflow vulnerabilities using GeminiService
   * @param contractCode The contract code to analyze
   * @param fileName The name of the file containing the contract code
   * @returns Analysis result with overflow/underflow vulnerabilities
   */
  async detectVulnerabilities(contractCode: string, fileName: string): Promise<any> {
    const analysis = await this.geminiService.analyzeSmartContract(contractCode, fileName);
    
    // Filter only overflow/underflow vulnerabilities
    const overflowVulnerabilities = analysis.vulnerabilities?.filter(
      vuln => vuln.type.toLowerCase().includes('overflow') || vuln.type.toLowerCase().includes('underflow')
    ) || [];
    
    return {
      vulnerabilities: overflowVulnerabilities,
      count: overflowVulnerabilities.length,
      found: overflowVulnerabilities.length > 0
    };
  }

  /**
   * Check for arithmetic operations in transaction data
   * @param data Transaction data
   * @returns True if suspicious arithmetic operations are found
   */
  private checkForArithmeticOperations(data: string): boolean {
    const arithmeticOperationKeywords = [
      'add',
      'sub',
      'mul',
      'div',
      'increment',
      'decrement',
      'increase',
      'decrease',
      '+',
      '-',
      '*',
      '/'
    ];
    
    // Check if transaction data contains arithmetic operations
    return arithmeticOperationKeywords.some(keyword => data.includes(keyword));
  }

  /**
   * Analyze contract code for integer overflow/underflow vulnerabilities
   * @param contractCode The contract code to analyze
   * @returns True if overflow/underflow vulnerability patterns are detected
   */
  private analyzeContractCode(contractCode: string): boolean {
    // Check for unsafe arithmetic operations
    const unsafeArithmetic = this.checkUnsafeArithmetic(contractCode);
    
    // Check for missing overflow checks
    const missingOverflowChecks = this.checkMissingOverflowChecks(contractCode);
    
    // Check for unsafe type usage
    const unsafeTypeUsage = this.checkUnsafeTypeUsage(contractCode);
    
    return unsafeArithmetic || missingOverflowChecks || unsafeTypeUsage;
  }

  /**
   * Check if the contract uses unsafe arithmetic operations
   * @param contractCode The contract code
   * @returns True if unsafe arithmetic is detected
   */
  private checkUnsafeArithmetic(contractCode: string): boolean {
    // In Rust for MultiversX, check for direct arithmetic without safe methods
    const directArithmeticPatterns = [
      /\w+\s*\+\s*\w+/g,  // addition
      /\w+\s*\-\s*\w+/g,  // subtraction
      /\w+\s*\*\s*\w+/g,  // multiplication
      /\w+\s*\/\s*\w+/g   // division
    ];
    
    // Check for unsafe arithmetic operations
    for (const pattern of directArithmeticPatterns) {
      if (pattern.test(contractCode)) {
        // Check if these operations are on BigUint/BigInt without safe wrappers
        if (contractCode.includes('BigUint') || contractCode.includes('BigInt')) {
          // Check if safe methods are missing
          if (!contractCode.includes('add') && 
              !contractCode.includes('sub') && 
              !contractCode.includes('mul') && 
              !contractCode.includes('div')) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if the contract is missing overflow checks
   * @param contractCode The contract code
   * @returns True if missing checks are detected
   */
  private checkMissingOverflowChecks(contractCode: string): boolean {
    // Check for arithmetic operations without overflow checks
    const hasArithmeticOperations = (
      contractCode.includes('+') || 
      contractCode.includes('-') || 
      contractCode.includes('*') || 
      contractCode.includes('/')
    );
    
    // Check for overflow protection mechanisms
    const hasOverflowProtection = (
      contractCode.includes('overflow') || 
      contractCode.includes('check_bound') || 
      contractCode.includes('require!(') || 
      contractCode.includes('sc_panic!(') ||
      contractCode.includes('SafeAdd') ||
      contractCode.includes('SafeSub') ||
      contractCode.includes('SafeMul') ||
      contractCode.includes('SafeDiv')
    );
    
    return hasArithmeticOperations && !hasOverflowProtection;
  }

  /**
   * Check if the contract uses unsafe numeric types
   * @param contractCode The contract code
   * @returns True if unsafe type usage is detected
   */
  private checkUnsafeTypeUsage(contractCode: string): boolean {
    // Check for unsafe use of fixed-size integers without proper validation
    const hasFixedSizeIntegers = (
      contractCode.includes('u8') || 
      contractCode.includes('u16') || 
      contractCode.includes('u32') || 
      contractCode.includes('u64') || 
      contractCode.includes('usize') ||
      contractCode.includes('i8') || 
      contractCode.includes('i16') || 
      contractCode.includes('i32') || 
      contractCode.includes('i64') || 
      contractCode.includes('isize')
    );
    
    // Check for cast operations without validation
    const hasCastOperations = (
      contractCode.includes('as u') || 
      contractCode.includes('as i') || 
      contractCode.includes('to_u') || 
      contractCode.includes('to_i')
    );
    
    // Check for validation patterns around type conversions
    const hasBoundChecks = (
      contractCode.includes('check_bound') || 
      contractCode.includes('require!(') || 
      contractCode.includes('sc_panic!(') ||
      contractCode.includes('max_value') ||
      contractCode.includes('min_value')
    );
    
    return (hasFixedSizeIntegers && hasCastOperations && !hasBoundChecks);
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
    let details = 'Potential integer overflow/underflow vulnerability detected. ';
    
    if (contractCode) {
      if (this.checkUnsafeArithmetic(contractCode)) {
        details += 'The contract uses unsafe arithmetic operations that could lead to overflow or underflow. ';
      }
      
      if (this.checkMissingOverflowChecks(contractCode)) {
        details += 'The contract lacks explicit overflow/underflow checks for arithmetic operations. ';
      }
      
      if (this.checkUnsafeTypeUsage(contractCode)) {
        details += 'The contract uses fixed-size integer types with casting operations without proper validation. ';
      }
    } else {
      details += 'The transaction contains patterns that suggest arithmetic operations which could be vulnerable to integer overflow or underflow. ';
    }
    
    return details;
  }

  /**
   * Get recommendations on how to fix integer overflow/underflow vulnerabilities
   * @returns Human-readable recommendations
   */
  getRecommendations(): string {
    return 'To fix integer overflow/underflow vulnerabilities: ' +
           '1. Use the built-in safe arithmetic methods for BigUint/BigInt (add, sub, mul, div). ' +
           '2. Add explicit boundary checks before arithmetic operations on fixed-size integers. ' +
           '3. Validate input values before performing arithmetic operations. ' +
           '4. Add require! statements to verify that arithmetic operations will not overflow or underflow. ' +
           '5. Consider using the SafeMath pattern or similar utility functions. ' +
           '6. Avoid unnecessary type conversions between different integer sizes. ' +
           '7. When converting from larger to smaller types, verify the value fits within the target type\'s range.';
  }
}