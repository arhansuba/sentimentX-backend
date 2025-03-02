import { Controller, Get } from '@nestjs/common';
import { AlertService } from './alert.service';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get('stats')
  async getAlertStats() {
    return this.alertService.getAlertStats(); // Implement this in AlertService
  }

  @Get('latest')
  async getLatestAlerts() {
    return this.alertService.getLatestAlerts(); // Implement this in AlertService
  }
}
