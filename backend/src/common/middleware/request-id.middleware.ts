import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class RequestIdMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.header('X-Request-ID', requestId);
    (req as any).id = requestId;
    next();
  }
}

