import { Injectable } from '@nestjs/common';

@Injectable()
export class NetworkService {
  async getNetworkInfo() {
    // Example logic (replace with real data source)
    return {
      chainId: 'D', // Example data
    };
  }
}
