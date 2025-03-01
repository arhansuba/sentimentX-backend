import { Controller, Get, Post, Param, Body, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AlertService } from '../services/alert.service';

class ResolveAlertDto {
  resolutionNotes?: string;
}

@ApiTags('alerts')
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  @ApiOperation({ summary: 'Get all security alerts' })
  @ApiQuery({ name: 'contractAddress', required: false, description: 'Filter by contract address' })
  @ApiQuery({ name: 'resolved', required: false, description: 'Filter by resolution status' })
  @ApiQuery({ name: 'minRiskScore', required: false, description: 'Filter by minimum risk score' })
  @ApiResponse({ status: 200, description: 'Returns list of security alerts' })
  async getAlerts(
    @Query('contractAddress') contractAddress?: string,
    @Query('resolved') resolved?: boolean,
    @Query('minRiskScore') minRiskScore?: number,
  ) {
    const filter = {
      contractAddress,
      resolved: resolved !== undefined ? resolved : undefined,
      minRiskScore: minRiskScore !== undefined ? minRiskScore : undefined,
    };
    
    const alerts = this.alertService.getAlerts(filter);
    
    return { 
      totalAlerts: alerts.length,
      alerts 
    };
  }

  @Get('high-risk')
  @ApiOperation({ summary: 'Get high-risk security alerts' })
  @ApiResponse({ status: 200, description: 'Returns list of high-risk security alerts' })
  async getHighRiskAlerts() {
    const alerts = this.alertService.getHighRiskAlerts();
    
    return { 
      totalAlerts: alerts.length,
      alerts 
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific alert by ID' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Returns the alert details' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlertById(@Param('id') id: string) {
    const alert = this.alertService.getAlertById(id);
    
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    
    return alert;
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Mark an alert as resolved' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiBody({ type: ResolveAlertDto })
  @ApiResponse({ status: 200, description: 'Alert marked as resolved' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async resolveAlert(
    @Param('id') id: string,
    @Body() body: ResolveAlertDto
  ) {
    const alert = await this.alertService.resolveAlert(id, body.resolutionNotes);
    
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    
    return { 
      success: true,
      message: `Alert ${id} marked as resolved`,
      alert 
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get summary statistics on alerts' })
  @ApiResponse({ status: 200, description: 'Returns alert statistics' })
  async getAlertStats() {
    const allAlerts = this.alertService.getAlerts();
    const openAlerts = this.alertService.getAlerts({ resolved: false });
    const highRiskAlerts = this.alertService.getHighRiskAlerts();
    
    // Count alerts by risk level
    const alertsByRiskLevel = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    };
    
    allAlerts.forEach(alert => {
      if (alertsByRiskLevel[alert.riskScore.level] !== undefined) {
        alertsByRiskLevel[alert.riskScore.level]++;
      }
    });
    
    // Group alerts by contract address
    const alertsByContract = {};
    allAlerts.forEach(alert => {
      const address = alert.contractAddress;
      if (!alertsByContract[address]) {
        alertsByContract[address] = 0;
      }
      alertsByContract[address]++;
    });
    
    // Find top vulnerable contracts
    const topVulnerableContracts = Object.entries(alertsByContract)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([address, count]) => ({ address, alertCount: count as number }));
    
    // Count alerts by vulnerability pattern
    const alertsByPattern = {};
    allAlerts.forEach(alert => {
      alert.patternIds.forEach(patternId => {
        if (!alertsByPattern[patternId]) {
          alertsByPattern[patternId] = 0;
        }
        alertsByPattern[patternId]++;
      });
    });
    
    // Find top vulnerability patterns
    const topVulnerabilityPatterns = Object.entries(alertsByPattern)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([patternId, count]) => ({ patternId, count: count as number }));
    
    return {
      totalAlerts: allAlerts.length,
      openAlerts: openAlerts.length,
      highRiskAlerts: highRiskAlerts.length,
      alertsByRiskLevel,
      topVulnerableContracts,
      topVulnerabilityPatterns
    };
  }
}