import { BigNumber } from 'bignumber.js';
import { RiskLevel } from '../dtos/alert.dto';

/**
 * Format EGLD amount for display
 * @param amount Amount in smallest denomination
 * @param decimals Number of decimals to show (default: 4)
 * @returns Formatted EGLD amount
 */
export function formatEgldAmount(amount: string | number, decimals: number = 4): string {
  try {
    const value = new BigNumber(amount);
    const formatted = value.dividedBy(10 ** 18).toFixed(decimals);
    return formatted.toString();
  } catch (error) {
    return '0';
  }
}

/**
 * Format ESDT token amount for display
 * @param amount Amount in smallest denomination
 * @param tokenDecimals Number of decimals the token has
 * @param displayDecimals Number of decimals to show (default: 4)
 * @returns Formatted token amount
 */
export function formatTokenAmount(
  amount: string | number,
  tokenDecimals: number,
  displayDecimals: number = 4
): string {
  try {
    const value = new BigNumber(amount);
    const formatted = value.dividedBy(10 ** tokenDecimals).toFixed(displayDecimals);
    return formatted.toString();
  } catch (error) {
    return '0';
  }
}

/**
 * Truncate address for display
 * @param address The full address
 * @param prefixLength Number of characters to keep at the beginning
 * @param suffixLength Number of characters to keep at the end
 * @returns Truncated address
 */
export function truncateAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  return `${address.substring(0, prefixLength)}...${address.substring(
    address.length - suffixLength
  )}`;
}

/**
 * Format timestamp as a relative time (e.g., "5 minutes ago")
 * @param timestamp The timestamp to format
 * @returns Relative time string
 */
export function formatTimeAgo(timestamp: Date | number | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}

/**
 * Format a date to a standard string format
 * @param date The date to format
 * @param includeTime Whether to include time (default: true)
 * @returns Formatted date string
 */
export function formatDate(date: Date | number | string, includeTime: boolean = true): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Get color for risk level
 * @param level Risk level
 * @returns Tailwind CSS color class
 */
export function getRiskLevelColor(level: RiskLevel | string): string {
  switch (level) {
    case RiskLevel.CRITICAL:
      return 'text-red-600';
    case RiskLevel.HIGH:
      return 'text-orange-600';
    case RiskLevel.MEDIUM:
      return 'text-yellow-600';
    case RiskLevel.LOW:
      return 'text-green-600';
    case RiskLevel.NONE:
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get background color for risk level badge
 * @param level Risk level
 * @returns Tailwind CSS color class
 */
export function getRiskLevelBadgeColor(level: RiskLevel | string): string {
  switch (level) {
    case RiskLevel.CRITICAL:
      return 'bg-red-100 text-red-800';
    case RiskLevel.HIGH:
      return 'bg-orange-100 text-orange-800';
    case RiskLevel.MEDIUM:
      return 'bg-yellow-100 text-yellow-800';
    case RiskLevel.LOW:
      return 'bg-green-100 text-green-800';
    case RiskLevel.NONE:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format a number as a percentage
 * @param value The value to format (e.g., 0.75)
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "75.0%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Convert snake_case to camelCase
 * @param str The string to convert
 * @returns Converted string
 */
export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

/**
 * Convert camelCase to snake_case
 * @param str The string to convert
 * @returns Converted string
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Parse transaction data field
 * @param dataField Base64 encoded data field
 * @returns Decoded data and function name if available
 */
export function parseTransactionData(dataField: string): { 
  decodedData: string, 
  functionName?: string 
} {
  try {
    // Decode base64
    const decoded = Buffer.from(dataField, 'base64').toString();
    
    // Split by @ to get function name and arguments
    const parts = decoded.split('@');
    let functionName: string | undefined;
    
    if (parts.length > 0 && parts[0]) {
      functionName = parts[0];
    }
    
    return {
      decodedData: decoded,
      functionName
    };
  } catch (error) {
    return {
      decodedData: dataField
    };
  }
}