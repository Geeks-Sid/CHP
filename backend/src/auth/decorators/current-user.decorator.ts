import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export interface CurrentUser {
  userId: string;
  username: string;
  email: string;
  roles: string[];
}

/**
 * Decorator to extract current user from request
 * Use with @CurrentUser() in controller methods
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return (request as any).user;
  },
);

