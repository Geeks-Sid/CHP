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
        // Apply correlation middleware to all routes
        consumer.apply(CorrelationMiddleware).forRoutes('*');
    }
}

