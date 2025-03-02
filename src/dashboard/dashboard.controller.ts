import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    try {
      const stats = await this.dashboardService.getDashboardStats();
      return stats;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw new Error('Failed to fetch dashboard stats');
    }
  }
}
