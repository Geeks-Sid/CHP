import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness() {
    return this.healthService.checkLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - checks DB and migrations' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    const status = await this.healthService.checkReadiness();
    
    // Return 503 if not ready (for Kubernetes)
    if (status.status !== 'ready') {
      return status;
    }
    
    return status;
  }
}

