import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from '../database/database.module';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PhiRedactionInterceptor } from './interceptors/phi-redaction.interceptor';
import { PayloadSizeMiddleware } from './middleware/payload-size.middleware';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { SecretsService } from './services/secrets.service';

@Module({
    imports: [DatabaseModule],
    providers: [
        SecretsService,
        PayloadSizeMiddleware,
        SecurityHeadersMiddleware,
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: PhiRedactionInterceptor,
        },
    ],
    exports: [SecretsService],
})
export class SecurityModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Apply security headers to all routes
        consumer.apply(SecurityHeadersMiddleware).forRoutes('*');

        // Apply payload size limits to all routes
        consumer.apply(PayloadSizeMiddleware).forRoutes('*');
    }
}

