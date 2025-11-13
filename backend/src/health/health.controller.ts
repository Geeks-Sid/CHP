import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async readiness() {
    const dbHealthy = await this.databaseService.healthCheck();

    return {
      status: dbHealthy ? 'ready' : 'not ready',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

