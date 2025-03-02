import { Controller, Get } from '@nestjs/common';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('info')
  async getNetworkInfo() {
    return this.networkService.getNetworkInfo(); // Implement this in NetworkService
  }
}
