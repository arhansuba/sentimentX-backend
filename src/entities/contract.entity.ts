/**
 * Entity representing a monitored smart contract
 */
export class Contract {
    /**
     * The blockchain address of the contract
     */
    address: string;
  
    /**
     * Human-readable name of the contract
     */
    name?: string;
  
    /**
     * When the contract was added to monitoring
     */
    addedAt: Date;
  
    /**
     * Last time the contract was analyzed
     */
    lastAnalyzedAt?: Date;
  
    /**
     * Latest security score (0-100)
     */
    securityScore?: number;
  
    /**
     * Whether the contract code has been verified
     */
    isVerified: boolean;
  
    /**
     * Total number of alerts for this contract
     */
    alertCount: number;
  
    /**
     * Number of high or critical risk alerts
     */
    highRiskAlerts: number;
  
    /**
     * Tags associated with this contract
     */
    tags: string[];
  
    /**
     * Additional metadata about the contract
     */
    metadata: Record<string, any>;
  
    constructor(data: Partial<Contract>) {
      this.address = data.address || '';
      this.name = data.name;
      this.addedAt = data.addedAt || new Date();
      this.lastAnalyzedAt = data.lastAnalyzedAt;
      this.securityScore = data.securityScore;
      this.isVerified = data.isVerified || false;
      this.alertCount = data.alertCount || 0;
      this.highRiskAlerts = data.highRiskAlerts || 0;
      this.tags = data.tags || [];
      this.metadata = data.metadata || {};
    }
  }
  
  /**
   * Entity representing a vulnerability pattern detection in a contract
   */
  export class ContractVulnerability {
    /**
     * Unique identifier for the vulnerability instance
     */
    id: string;
  
    /**
     * Contract address where the vulnerability was found
     */
    contractAddress: string;
  
    /**
     * Vulnerability pattern ID
     */
    patternId: string;
  
    /**
     * Human-readable name of the vulnerability
     */
    name: string;
  
    /**
     * Description of the vulnerability
     */
    description: string;
  
    /**
     * Risk severity (critical, high, medium, low)
     */
    severity: string;
  
    /**
     * Specific location in the contract code
     */
    location?: string;
  
    /**
     * Time when the vulnerability was detected
     */
    detectedAt: Date;
  
    /**
     * Whether the vulnerability has been resolved
     */
    isResolved: boolean;
  
    /**
     * Notes on how the vulnerability was resolved
     */
    resolutionNotes?: string;
  
    constructor(data: Partial<ContractVulnerability>) {
      this.id = data.id || '';
      this.contractAddress = data.contractAddress || '';
      this.patternId = data.patternId || '';
      this.name = data.name || '';
      this.description = data.description || '';
      this.severity = data.severity || 'low';
      this.location = data.location;
      this.detectedAt = data.detectedAt || new Date();
      this.isResolved = data.isResolved || false;
      this.resolutionNotes = data.resolutionNotes;
    }
  }