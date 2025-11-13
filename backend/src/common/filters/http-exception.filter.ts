import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../logger/logger.config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const requestId = (request.headers['x-request-id'] as string) || 'unknown';
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message: typeof message === 'string' ? message : (message as any).message || 'Error',
      details: typeof message === 'object' && 'details' in message ? (message as any).details : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // Log error (but hide internal details in production)
    if (status >= 500) {
      logger.error(
        {
          requestId,
          status,
          path: request.url,
          method: request.method,
          error: exception instanceof Error ? exception.stack : exception,
        },
        'Internal server error',
      );
    } else {
      logger.warn(
        {
          requestId,
          status,
          path: request.url,
          method: request.method,
        },
        'Client error',
      );
    }

    // Don't expose internal error details in production
    if (status >= 500 && process.env.NODE_ENV === 'production') {
      errorResponse.message = 'Internal server error';
      delete errorResponse.details;
    }

    response.status(status).send(errorResponse);
  }
}

