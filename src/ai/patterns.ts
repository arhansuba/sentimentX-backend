import { Transaction } from '@multiversx/sdk-core/out';

/**
 * Defines a vulnerability pattern to detect in transactions and contracts
 */
export interface VulnerabilityPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detector: (transaction: Transaction, contractCode?: string) => boolean;
}

/**
 * Collection of known vulnerability patterns to check against
 */
export const knownPatterns: VulnerabilityPattern[] = [
  {
    id: 'reentrancy',
    name: 'Reentrancy Attack Pattern',
    description: 'Potential reentrancy vulnerability detected. The contract may be calling external contracts before updating its own state.',
    severity: 'critical',
    detector: (transaction: Transaction, contractCode?: string) => {
      // This is a simplified implementation for demonstration
      // A real implementation would analyze the bytecode or data field
      
      // Look for patterns in transaction data that might indicate reentrancy
      const data = transaction.getData().toString();
      return data.includes('transfer') && data.includes('call');
    },
  },
  {
    id: 'flash-loan-attack',
    name: 'Flash Loan Attack Pattern',
    description: 'Transaction pattern matches known flash loan attack behaviors.',
    severity: 'high',
    detector: (transaction: Transaction) => {
      // Look for large value transactions with complex data
      const data = transaction.getData().toString();
      const value = Number(transaction.getValue().toString());
      
      // Very large transaction with loan-related operations may indicate flash loan
      return value > 1000000000000000000 && 
             (data.includes('flash') || data.includes('loan') || 
              data.includes('borrow') || data.includes('swap'));
    },
  },
  {
    id: 'integer-overflow',
    name: 'Integer Overflow/Underflow',
    description: 'Potential integer overflow or underflow vulnerability detected.',
    severity: 'high',
    detector: (transaction: Transaction, contractCode?: string) => {
      // Look for arithmetic operations on large numbers without proper checks
      const data = transaction.getData().toString();
      
      // Check for large number handling without SafeMath-like patterns
      if (contractCode) {
        return !contractCode.includes('SafeInteger') && 
               (data.includes('add') || data.includes('subtract') || 
                data.includes('multiply') || data.includes('divide'));
      }
      
      // If no code available, use transaction data for heuristics
      return data.includes('0xffffffff') || data.includes('maxvalue');
    },
  },
  {
    id: 'access-control',
    name: 'Access Control Issue',
    description: 'Possible unauthorized access to restricted functions.',
    severity: 'medium',
    detector: (transaction: Transaction) => {
      // Look for admin/owner functions being called
      const data = transaction.getData().toString();
      
      // Functions that typically should be access-controlled
      const sensitiveActions = [
        'setOwner', 
        'changeOwner', 
        'withdraw',
        'transferOwnership',
        'upgrade',
        'setAdmin',
        'setFeePercent'
      ];
      
      return sensitiveActions.some(action => data.includes(action));
    },
  },
  {
    id: 'suspicious-token-transfers',
    name: 'Suspicious Token Transfer Pattern',
    description: 'Unusual pattern of token transfers that might indicate fraudulent activity.',
    severity: 'medium',
    detector: (transaction: Transaction) => {
      // Detect unusual token transfer patterns
      const data = transaction.getData().toString();
      
      // Check for multiple transfers in a single transaction
      const transferCount = (data.match(/transfer/g) || []).length;
      
      return transferCount > 3 || (data.includes('transfer') && data.includes('approve'));
    },
  },
  {
    id: 'low-gas-griefing',
    name: 'Low Gas Griefing Attack',
    description: 'Transaction may be attempting to cause a contract to run out of gas.',
    severity: 'low',
    detector: (transaction: Transaction) => {
      // Look for transactions with unusually low gas settings
      const gasLimit = transaction.getGasLimit().valueOf();
      
      // Suspiciously low gas limit might indicate griefing attack
      return gasLimit < 30000 && transaction.getData().toString().length > 100;
    },
  },
  {
    id: 'timestamp-dependence',
    name: 'Timestamp Dependence',
    description: 'Contract logic appears to rely heavily on block timestamps, which can be manipulated by miners.',
    severity: 'low',
    detector: (transaction: Transaction, contractCode?: string) => {
      // Check for time-dependent code in contract or transaction data
      if (contractCode) {
        return contractCode.includes('getTimestamp') || 
               contractCode.includes('block.timestamp');
      }
      
      // If no code available, look for time-related functions in transaction data
      const data = transaction.getData().toString();
      return data.includes('time') || data.includes('timestamp') || 
             data.includes('deadline') || data.includes('expiry');
    },
  }
];