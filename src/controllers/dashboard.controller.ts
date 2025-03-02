import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    try {
      return await this.dashboardService.getDashboardStats();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard stats');
    }
  }
}
