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

    // Redact sensitive information from error messages
    const redactedMessage = this.redactSensitiveInfo(
      typeof message === 'string' ? message : (message as any).message || 'Error',
    );

    // Log error (but hide internal details in production)
    if (status >= 500) {
      // Redact sensitive info from stack traces
      const errorInfo = exception instanceof Error ? this.redactSensitiveInfo(exception.stack || exception.message) : 'Unknown error';
      logger.error(
        {
          requestId,
          status,
          path: request.url,
          method: request.method,
          error: errorInfo,
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
          message: redactedMessage,
        },
        'Client error',
      );
    }

    // Don't expose internal error details in production
    if (status >= 500 && process.env.NODE_ENV === 'production') {
      errorResponse.message = 'Internal server error';
      delete errorResponse.details;
    } else {
      // Redact sensitive info from error response
      errorResponse.message = redactedMessage;
    }

    response.status(status).send(errorResponse);
  }

  /**
   * Redact sensitive information from error messages
   * Prevents PII/secrets from leaking in error responses
   */
  private redactSensitiveInfo(text: string | undefined): string {
    if (!text) {
      return '';
    }

    // Patterns to redact
    const patterns = [
      // JWT tokens
      /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi,
      // Email addresses
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      // Phone numbers
      /\+?[\d\s\-\(\)]{10,}/g,
      // SSN patterns
      /\d{3}-\d{2}-\d{4}/g,
      // API keys (common patterns)
      /(api[_-]?key|apikey|secret|token|password)\s*[:=]\s*['"]?[A-Za-z0-9\-_]+['"]?/gi,
      // Database connection strings
      /(postgres|mysql|mongodb):\/\/[^\s]+/gi,
    ];

    let redacted = text;
    for (const pattern of patterns) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }

    return redacted;
  }
}

