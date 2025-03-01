import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';
import { CacheService } from '../services/cache.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Returns Prometheus metrics' })
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return await this.metricsService.getMetrics();
  }

  @Get('cache')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Returns cache statistics' })
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }
}