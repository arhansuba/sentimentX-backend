import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@multiversx/sdk-core/out';
import { BasePatternDetector, VulnerabilityPattern } from '../models/pattern.model';
import { GeminiService } from '../gemini-service';

/**
 * Detector for reentrancy vulnerabilities in MultiversX smart contracts
 * 
 * Reentrancy attacks occur when a contract function can be interrupted during
 * execution and called again before the first invocation is complete.
 */
@Injectable()
export class ReentrancyDetector extends BasePatternDetector {
  private readonly logger = new Logger(ReentrancyDetector.name);
  constructor(private readonly geminiService: GeminiService) {
    super();
  }

  /**
   * Pattern definition for reentrancy vulnerabilities
   */
  readonly pattern: VulnerabilityPattern = {
    id: 'reentrancy',
    name: 'Reentrancy Attack Pattern',
    description: 'Detects potential reentrancy vulnerabilities where an external contract can recursively call back into the vulnerable contract before the first invocation is complete.',
    severity: 'critical',
    detector: this.detectReentrancyPattern.bind(this),
    category: ''
  };

  /**
   * Analyzes a transaction and contract code for reentrancy vulnerabilities
   * @param transaction The transaction to analyze
   * @param contractCode The contract code if available
   * @returns True if reentrancy patterns are detected
   */
  private detectReentrancyPattern(transaction: Transaction, contractCode?: string): boolean {
    try {
      // Check transaction data for patterns indicating reentrancy
      const data = this.getTransactionData(transaction);
      
      // Look for suspicious patterns in transaction data
      const hasTransferCall = data.includes('transfer') && data.includes('call');
      const hasSendBeforeState = data.includes('send') && data.includes('storage');
      
      // If contract code is available, perform deeper analysis
      if (contractCode) {
        return this.analyzeContractCode(contractCode) || hasTransferCall || hasSendBeforeState;
      }
      
      return hasTransferCall || hasSendBeforeState;
    } catch (error) {
      this.logger.error(`Error in reentrancy detection: ${error.message}`);
      return false;
    }
  }

  /**
   * Analyze contract code for reentrancy vulnerabilities
   * @param contractCode The contract code to analyze
   * @returns True if reentrancy patterns are detected in code
   */
  private analyzeContractCode(contractCode: string): boolean {
    // Check for external calls before state changes
    const externalCallBeforeStateChange = this.checkExternalCallBeforeStateChange(contractCode);
    
    // Check for missing reentrancy guards
    const missingReentrancyGuard = !contractCode.includes('reentrancy_guard') && 
                                  !contractCode.includes('ReentrancyGuard');
    
    // Check for state changes after external calls
    const stateChangeAfterExternalCall = this.checkStateChangeAfterExternalCall(contractCode);
    
    return (externalCallBeforeStateChange && missingReentrancyGuard) || stateChangeAfterExternalCall;
  }

  /**
   * Check if the contract has external calls before state changes
   * @param contractCode The contract code to analyze
   * @returns True if the pattern is detected
   */
  private checkExternalCallBeforeStateChange(contractCode: string): boolean {
    // Look for patterns where external calls are followed by state changes
    const externalCallFunctions = [
      'send().direct',
      'self.send()',
      'self.send_raw()',
      'call'
    ];
    
    const stateChangeFunctions = [
      'self.storage.set',
      'set(',
      'update',
      'store',
      'write'
    ];
    
    // Simplified detection - in a real implementation, we would parse the code more carefully
    for (const externalCall of externalCallFunctions) {
      if (!contractCode.includes(externalCall)) continue;
      
      // Find location of external call
      const externalCallIndex = contractCode.indexOf(externalCall);
      
      // Check if any state change function appears after the external call
      for (const stateChange of stateChangeFunctions) {
        const stateChangeIndex = contractCode.indexOf(stateChange, externalCallIndex);
        if (stateChangeIndex > externalCallIndex) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if the contract changes state after external calls
   * @param contractCode The contract code to analyze
   * @returns True if the pattern is detected
   */
  private checkStateChangeAfterExternalCall(contractCode: string): boolean {
    // Similar to checkExternalCallBeforeStateChange but more focused on function structure
    
    // Split contract into functions for easier analysis
    const functions = this.extractFunctions(contractCode);
    
    for (const func of functions) {
      // Check if function contains external calls
      const hasExternalCall = func.includes('send().direct') || 
                             func.includes('self.send()') || 
                             func.includes('self.send_raw()') ||
                             func.includes('call');
      
      if (!hasExternalCall) continue;
      
      // Check if function contains state changes after external calls
      const externalCallIndex = Math.max(
        func.indexOf('send().direct'),
        func.indexOf('self.send()'),
        func.indexOf('self.send_raw()'),
        func.indexOf('call')
      );
      
      // Look for state changes after the external call
      const hasStateChangeAfter = func.indexOf('self.storage.set', externalCallIndex) > externalCallIndex ||
                                 func.indexOf('set(', externalCallIndex) > externalCallIndex ||
                                 func.indexOf('update', externalCallIndex) > externalCallIndex ||
                                 func.indexOf('store', externalCallIndex) > externalCallIndex ||
                                 func.indexOf('write', externalCallIndex) > externalCallIndex;
      
      if (hasStateChangeAfter) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract functions from contract code for analysis
   * @param contractCode The contract code
   * @returns Array of function bodies
   */
  private extractFunctions(contractCode: string): string[] {
    // Very simplified implementation - in a real detector, use proper parsing
    const functions: string[] = [];
    
    // Find function declarations in MultiversX Rust contracts
    const fnMatches = contractCode.matchAll(/fn\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:->.*?)?\s*\{([^}]*)\}/gs);
    
    for (const match of fnMatches) {
      if (match[2]) {
        functions.push(match[2]);
      }
    }
    
    return functions;
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
    let details = 'Potential reentrancy vulnerability detected. ';
    
    if (contractCode) {
      if (this.checkExternalCallBeforeStateChange(contractCode)) {
        details += 'The contract makes external calls before updating its state, which could allow an attacker to re-enter the contract before state updates are applied. ';
      }
      
      if (this.checkStateChangeAfterExternalCall(contractCode)) {
        details += 'The contract updates state after making external calls, violating the checks-effects-interactions pattern. ';
      }
      
      if (!contractCode.includes('reentrancy_guard') && !contractCode.includes('ReentrancyGuard')) {
        details += 'No reentrancy guard mechanism was detected in the contract. ';
      }
    } else {
      details += 'The transaction data contains patterns that may indicate reentrancy vulnerabilities, such as external calls followed by state changes. ';
    }
    
    return details;
  }

  /**
   * Log detailed information about detected vulnerabilities
   * @param transaction The transaction that was analyzed
   * @param contractCode The contract code that was analyzed
   */
  private logDetectionDetails(transaction: Transaction, contractCode?: string): void {
    const details = this.getDetails(transaction, contractCode);
    this.logger.log(`Detection details: ${details}`);
  }

  /**
   * Get recommendations on how to fix reentrancy vulnerabilities
   * @returns Human-readable recommendations
   */
  getRecommendations(): string {
    return 'To fix reentrancy vulnerabilities, implement the checks-effects-interactions pattern: ' +
           '1. Perform all state checks at the beginning of the function. ' +
           '2. Update all state variables before making any external calls. ' +
           '3. Make external calls after all state changes. ' +
           'Additionally, consider implementing a reentrancy guard using a mutex pattern to prevent multiple calls to sensitive functions.';
  }

  /**
   * Analyze smart contract code for reentrancy vulnerabilities using GeminiService
   * @param contractCode The contract code to analyze
   * @param fileName The name of the file containing the contract code
   * @returns Analysis result with reentrancy vulnerabilities
   */
  detect(transaction: Transaction, contractCode?: string): boolean {
    try {
      const data = this.getTransactionData(transaction);
      const hasTransferCall = data.includes('transfer') && data.includes('call');
      const hasSendBeforeState = data.includes('send') && data.includes('storage');
      
      if (contractCode) {
        return this.analyzeContractCode(contractCode) || hasTransferCall || hasSendBeforeState;
      }
      
      return hasTransferCall || hasSendBeforeState;
    } catch (error) {
      this.logger.error(`Error in reentrancy detection: ${error.message}`);
      return false;
    }
  }
}