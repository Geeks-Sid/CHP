import { Injectable, NestMiddleware, PayloadTooLargeException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../common/logger/logger.config';

/**
 * Payload Size Middleware
 * Enforces maximum request body size limits
 * Prevents DoS attacks via large payloads
 */
@Injectable()
export class PayloadSizeMiddleware implements NestMiddleware {
    private readonly maxPayloadSize: number;

    constructor() {
        // Default: 1MB for JSON payloads
        // Adjust based on your needs (e.g., 10MB for file uploads)
        this.maxPayloadSize = parseInt(process.env.MAX_PAYLOAD_SIZE || '1048576', 10); // 1MB default
    }

    use(req: FastifyRequest, res: FastifyReply, next: () => void) {
        const contentLength = req.headers['content-length'];

        if (contentLength) {
            const size = parseInt(contentLength, 10);

            if (size > this.maxPayloadSize) {
                logger.warn(
                    {
                        size,
                        maxSize: this.maxPayloadSize,
                        path: req.url,
                        ip: req.ip,
                    },
                    'Payload size exceeded',
                );
                throw new PayloadTooLargeException(
                    `Request payload size (${size} bytes) exceeds maximum allowed size (${this.maxPayloadSize} bytes)`,
                );
            }
        }

        // Fastify has built-in body size limits, but we add explicit check
        // Fastify default is 1MB, can be configured in FastifyAdapter options
        next();
    }
}

