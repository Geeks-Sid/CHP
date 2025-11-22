import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CorrelationMiddleware } from './middleware/correlation.middleware';
import { CorrelationService } from './services/correlation.service';

@Global()
@Module({
    providers: [CorrelationService, CorrelationMiddleware],
    exports: [CorrelationService],
})
export class TelemetryModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Correlation middleware is now registered as Fastify hook in main.ts
        // to avoid type issues with FastifyReply
    }
}

