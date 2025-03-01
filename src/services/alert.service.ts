import { Injectable, Logger } from '@nestjs/common';
import { RiskScore } from '../ai/scoring';
import { CacheService } from './cache.service';

export interface Alert {
  id?: string;
  contractAddress: string;
  transactionHash: string;
  riskScore: RiskScore;
  details: string;
  timestamp: Date;
  patternIds: string[];
  resolved?: boolean;
  resolutionNotes?: string;
}

@Injectable()
export class AlertService {
  create(arg0: { contractId: string; type: any; title: string; description: any; lines: any; impact: any; recommendation: any; timestamp: Date; }) {
    throw new Error('Method not implemented.');
  }
  findByContractId(contractId: string) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(AlertService.name);
  private nextAlertId = 1;
  private alerts: Map<string, Alert> = new Map();

  constructor(private readonly cacheService: CacheService) {
    this.loadAlerts();
  }

  /**
   * Create a new security alert
   */
  async createAlert(alert: Omit<Alert, 'id'>): Promise<Alert> {
    // Generate a unique ID for the alert
    const id = `alert-${Date.now()}-${this.nextAlertId++}`;
    
    const newAlert: Alert = {
      ...alert,
      id,
      resolved: false,
    };
    
    // Store the alert
    this.alerts.set(id, newAlert);
    
    // Save to persistent storage
    await this.saveAlerts();
    
    this.logger.log(`Created new alert: ${id} for contract ${alert.contractAddress}`);
    
    return newAlert;
  }

  /**
   * Get all alerts, with optional filtering
   */
  getAlerts(filter?: {
    contractAddress?: string;
    minRiskScore?: number;
    resolved?: boolean;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());
    
    if (filter) {
      if (filter.contractAddress) {
        alerts = alerts.filter(a => a.contractAddress === filter.contractAddress);
      }
      
      if (filter.minRiskScore !== undefined) {
        alerts = alerts.filter(a => a.riskScore.score >= (filter.minRiskScore ?? 0));
      }
      
      if (filter.resolved !== undefined) {
        alerts = alerts.filter(a => a.resolved === filter.resolved);
      }
    }
    
    // Sort by timestamp (newest first)
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get a specific alert by ID
   */
  getAlertById(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  /**
   * Mark an alert as resolved
   */
  async resolveAlert(id: string, resolutionNotes?: string): Promise<Alert | null> {
    const alert = this.alerts.get(id);
    
    if (!alert) {
      return null;
    }
    
    alert.resolved = true;
    alert.resolutionNotes = resolutionNotes;
    
    // Update in storage
    this.alerts.set(id, alert);
    await this.saveAlerts();
    
    this.logger.log(`Resolved alert: ${id}`);
    
    return alert;
  }

  /**
   * Get alerts by contract address
   */
  getAlertsByContract(contractAddress: string): Alert[] {
    return this.getAlerts({ contractAddress });
  }

  /**
   * Get high-risk alerts
   */
  getHighRiskAlerts(): Alert[] {
    return this.getAlerts({ minRiskScore: 50 }); // Alerts with score >= 50
  }

  /**
   * Delete an alert
   */
  async deleteAlert(id: string): Promise<boolean> {
    const deleted = this.alerts.delete(id);
    
    if (deleted) {
      await this.saveAlerts();
      this.logger.log(`Deleted alert: ${id}`);
    }
    
    return deleted;
  }

  /**
   * Save alerts to cache
   */
  private async saveAlerts(): Promise<void> {
    try {
      const alerts = Array.from(this.alerts.values());
      await this.cacheService.setLocal('security:alerts', alerts, 0); // No expiration
    } catch (error) {
      this.logger.error(`Error saving alerts: ${error.message}`);
    }
  }

  /**
   * Load alerts from cache
   */
  private async loadAlerts(): Promise<void> {
    try {
      const alerts = await this.cacheService.getLocal<Alert[]>('security:alerts');
      
      if (alerts && Array.isArray(alerts)) {
        // Parse date strings back to Date objects
        alerts.forEach(alert => {
          if (typeof alert.timestamp === 'string') {
            alert.timestamp = new Date(alert.timestamp);
          }
          if (alert.id) {
            this.alerts.set(alert.id, alert);
          } else {
            this.logger.error('Alert ID is undefined');
          }
        });
        
        // Update next ID
        const maxId = Math.max(...alerts.map(a => {
          const idParts = a.id ? a.id.split('-') : ['0'];
          return parseInt(idParts[idParts.length - 1], 10);
        }), 0);
        
        this.nextAlertId = maxId + 1;
        
        this.logger.log(`Loaded ${alerts.length} alerts from storage`);
      }
    } catch (error) {
      this.logger.error(`Error loading alerts: ${error.message}`);
    }
  }
}