import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { CorrelationService } from '../services/correlation.service';

/**
 * Correlation Middleware
 * Sets up correlation context for request/DB trace propagation
 * Uses AsyncLocalStorage to maintain context across async operations
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
    constructor(private readonly correlationService: CorrelationService) { }

    use(req: FastifyRequest, res: FastifyReply, next: () => void) {
        // Extract correlation context from request
        const context = this.correlationService.extractFromRequest(req);

        // Set response header with trace ID
        res.header('X-Trace-ID', context.traceId);
        res.header('X-Request-ID', context.requestId);

        // Run the rest of the request handling with correlation context
        this.correlationService.runWithContext(context, () => {
            next();
        });
    }
}

