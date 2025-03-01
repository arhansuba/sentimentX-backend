import { Module, DynamicModule } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';

@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {
  static forRoot(p0: { defaultLabels: { application: string; }; }): DynamicModule {
    return {
      module: MetricsModule,
      providers: [MetricsService],
      exports: [MetricsService],
    };
  }
}
