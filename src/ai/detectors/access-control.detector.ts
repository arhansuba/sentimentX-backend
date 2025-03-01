import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@multiversx/sdk-core/out';
import { BasePatternDetector, VulnerabilityPattern } from '../models/pattern.model';
import { GeminiService } from '../gemini-service';

/**
 * Detector for access control vulnerabilities in MultiversX smart contracts
 * 
 * Access control vulnerabilities occur when a contract lacks proper authorization
 * checks, allowing unauthorized users to execute privileged functions.
 */
@Injectable()
export class AccessControlDetector extends BasePatternDetector {
  private readonly logger = new Logger(AccessControlDetector.name);
  constructor(private readonly geminiService: GeminiService) {
    super();
  }

  /**
   * Pattern definition for access control vulnerabilities
   */
  readonly pattern: VulnerabilityPattern = {
    id: 'access-control',
    name: 'Access Control Issue',
    description: 'Detects missing or insufficient access controls that could allow unauthorized users to access privileged functions.',
    severity: 'high',
    detector: this.detectAccessControlIssue.bind(this),
    category: ''
  };

  /**
   * Analyzes a transaction and contract code for access control vulnerabilities
   * @param transaction The transaction to analyze
   * @param contractCode The contract code if available
   * @returns True if access control issues are detected
   */
  private detectAccessControlIssue(transaction: Transaction, contractCode?: string): boolean {
    try {
      // Check transaction data for patterns indicating access control operations
      const data = this.getTransactionData(transaction);
      
      // Look for suspicious administrative functions in transaction data
      const isAdminFunction = this.checkForAdminFunction(data);
      
      // If contract code is available, perform deeper analysis
      if (contractCode) {
        return this.analyzeContractCode(contractCode, transaction) || isAdminFunction;
      }
      
      return isAdminFunction;
    } catch (error) {
      this.logger.error(`Error in access control detection: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if transaction is calling administrative functions
   * @param data Transaction data
   * @returns True if administrative function calls are detected
   */
  private checkForAdminFunction(data: string): boolean {
    const adminFunctionKeywords = [
      'set_owner',
      'setOwner',
      'change_owner',
      'changeOwner',
      'transfer_ownership',
      'transferOwnership',
      'set_admin',
      'setAdmin',
      'upgrade',
      'pause',
      'unpause',
      'withdraw',
      'emergency',
      'set_fee',
      'setFee',
      'update_config',
      'updateConfig'
    ];
    
    // Check if transaction data contains admin function calls
    return adminFunctionKeywords.some(keyword => data.includes(keyword));
  }

  /**
   * Analyze contract code for access control vulnerabilities
   * @param contractCode The contract code to analyze
   * @param transaction The transaction being analyzed
   * @returns True if access control vulnerabilities are detected
   */
  private analyzeContractCode(contractCode: string, transaction: Transaction): boolean {
    // Extract function from transaction data (simplified approach)
    const functionName = this.extractFunctionName(transaction);
    
    // Analyze all sensitive functions if specific function name not available
    if (!functionName) {
      // Check for missing access control patterns in the whole contract
      return this.checkMissingAccessControls(contractCode);
    }
    
    // Analyze specific function for access control
    return this.checkFunctionAccessControl(contractCode, functionName);
  }

  /**
   * Extract function name from transaction data
   * @param transaction The transaction to analyze
   * @returns Function name if detected, null otherwise
   */
  private extractFunctionName(transaction: Transaction): string | null {
    try {
      const data = this.getTransactionData(transaction);
      
      // In MultiversX, function calls in transaction data are often formatted as "function@params"
      const parts = data.split('@');
      if (parts.length > 0 && parts[0]) {
        return parts[0];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if the contract has missing access controls
   * @param contractCode The contract code
   * @returns True if missing access controls are detected
   */
  private checkMissingAccessControls(contractCode: string): boolean {
    // Check for presence of access control mechanisms
    const hasAccessControlMechanisms = (
      contractCode.includes('only_owner') || 
      contractCode.includes('require!(self.blockchain().get_caller() == self.owner') ||
      contractCode.includes('require!(caller == owner') ||
      contractCode.includes('onlyOwner') ||
      contractCode.includes('only_admin') ||
      contractCode.includes('only_role') ||
      contractCode.includes('require_role') ||
      contractCode.includes('access_control')
    );
    
    // Check for sensitive functions that typically require access control
    const hasSensitiveFunctions = this.checkForSensitiveFunctions(contractCode);
    
    return hasSensitiveFunctions && !hasAccessControlMechanisms;
  }

  /**
   * Check if a specific function has proper access control
   * @param contractCode The contract code
   * @param functionName The name of the function to check
   * @returns True if the function lacks proper access control
   */
  private checkFunctionAccessControl(contractCode: string, functionName: string): boolean {
    // Find the function in the contract code
    const functionRegex = new RegExp(`fn\\s+${functionName}\\s*\\([^)]*\\)\\s*(?:->.*?)?\\s*\\{([^}]*)\\}`, 'gs');
    const match = functionRegex.exec(contractCode);
    
    // If function not found, can't analyze it
    if (!match || !match[1]) {
      return false;
    }
    
    const functionBody = match[1];
    
    // Check if this is a sensitive function
    const isSensitiveFunction = this.isSensitiveOperationName(functionName);
    
    // If not a sensitive function by name, check if it performs sensitive operations
    const performsSensitiveOperations = this.checkForSensitiveOperations(functionBody);
    
    // If this is a sensitive function or performs sensitive operations,
    // check if it has proper access control
    if (isSensitiveFunction || performsSensitiveOperations) {
      const hasAccessControl = (
        functionBody.includes('only_owner') || 
        functionBody.includes('require!(self.blockchain().get_caller() == self.owner') ||
        functionBody.includes('require!(caller == owner') ||
        functionBody.includes('only_admin') ||
        functionBody.includes('only_role') ||
        functionBody.includes('require_role') ||
        functionBody.includes('require!')
      );
      
      return !hasAccessControl;
    }
    
    return false;
  }

  /**
   * Check if a function name indicates a sensitive operation
   * @param functionName The function name
   * @returns True if the function name suggests sensitive operations
   */
  private isSensitiveOperationName(functionName: string): boolean {
    const sensitiveFunctionNames = [
      'set_owner',
      'set_admin',
      'change_owner',
      'transfer_ownership',
      'upgrade',
      'pause',
      'unpause',
      'withdraw',
      'set_fee',
      'update_config',
      'set_address',
      'set_parameter',
      'init',
      'initialize'
    ];
    
    // Also check camelCase variants
    const camelCaseFunctionName = this.snakeToCamel(functionName);
    
    return sensitiveFunctionNames.some(name => 
      functionName === name || 
      camelCaseFunctionName === this.snakeToCamel(name)
    );
  }

  /**
   * Check if the contract contains sensitive functions
   * @param contractCode The contract code
   * @returns True if sensitive functions are detected
   */
  private checkForSensitiveFunctions(contractCode: string): boolean {
    // Extract all function names
    const functionMatches = contractCode.matchAll(/fn\s+([a-zA-Z0-9_]+)\s*\(/g);
    const functionNames = Array.from(functionMatches).map(match => match[1]);
    
    // Check if any function name suggests sensitive operations
    return functionNames.some(name => this.isSensitiveOperationName(name));
  }

  /**
   * Check if function body contains sensitive operations
   * @param functionBody The function body code
   * @returns True if sensitive operations are detected
   */
  private checkForSensitiveOperations(functionBody: string): boolean {
    const sensitiveOperations = [
      'storage.set',
      'set(',
      'self.owner().set',
      'self.owner_address().set',
      'self.paused().set',
      'withdraw',
      'send().direct',
      'self.send()',
      'burn',
      'mint',
      'clear',
      'delete',
      'upgrade'
    ];
    
    return sensitiveOperations.some(op => functionBody.includes(op));
  }

  /**
   * Convert snake_case to camelCase
   * @param str The string to convert
   * @returns Converted string
   */
  private snakeToCamel(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
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
    let details = 'Potential access control vulnerability detected. ';
    
    const functionName = this.extractFunctionName(transaction);
    
    if (functionName) {
      details += `The function "${functionName}" may not have proper access controls. `;
      
      if (this.isSensitiveOperationName(functionName)) {
        details += `This function name suggests it performs sensitive operations that should be restricted to authorized users. `;
      }
    } else {
      details += 'The transaction appears to be calling a sensitive function that may lack proper access controls. ';
    }
    
    if (contractCode) {
      if (this.checkMissingAccessControls(contractCode)) {
        details += 'The contract appears to be missing proper access control mechanisms for sensitive operations. ';
      }
      
      const hasSomeSecurity = (
        contractCode.includes('only_owner') || 
        contractCode.includes('require!(') ||
        contractCode.includes('onlyOwner')
      );
      
      if (hasSomeSecurity) {
        details += 'While the contract has some access controls, they may not be applied consistently to all sensitive functions. ';
      } else {
        details += 'No access control mechanisms were detected in the contract. ';
      }
    }
    
    return details;
  }

  /**
   * Get recommendations on how to fix access control vulnerabilities
   * @returns Human-readable recommendations
   */
  getRecommendations(): string {
    return 'To fix access control vulnerabilities: ' +
           '1. Implement role-based access control for all sensitive operations. ' +
           '2. Add ownership mechanisms and ensure only the owner can call administrative functions. ' +
           '3. Use the only_owner! macro or similar mechanisms for all sensitive functions. ' +
           '4. Add explicit checks like require!(self.blockchain().get_caller() == self.owner()); at the beginning of sensitive functions. ' +
           '5. Consider implementing a multi-signature mechanism for critical operations. ' +
           '6. Follow the principle of least privilege - restrict each function to the minimum access level required. ' +
           '7. Add events to log all administrative actions for transparency. ' +
           '8. Consider timelock mechanisms for sensitive operations. ' +
           '9. Review all state-changing functions to ensure proper access control.';
  }

  /**
   * Analyze smart contract code for access control vulnerabilities using GeminiService
   * @param contractCode The contract code to analyze
   * @param fileName The name of the file containing the contract code
   * @returns Analysis result with access control vulnerabilities
   */
  async analyze(contractCode: string, fileName: string): Promise<any> {
    const analysis = await this.geminiService.analyzeSmartContract(contractCode, fileName);
    
    // Filter only access control vulnerabilities
    const accessControlVulnerabilities = analysis.vulnerabilities?.filter(
      vuln => vuln.type.toLowerCase().includes('access control') || 
              vuln.type.toLowerCase().includes('permission') ||
              vuln.type.toLowerCase().includes('authorization')
    ) || [];
    
    return {
      vulnerabilities: accessControlVulnerabilities,
      count: accessControlVulnerabilities.length,
      found: accessControlVulnerabilities.length > 0
    };
  }
}