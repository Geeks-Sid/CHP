import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../services/jwt.service';
import { FastifyRequest } from 'fastify';
import { logger } from '../../common/logger/logger.config';

/**
 * JWT Auth Guard
 * Verifies JWT token and attaches user to request
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);
      
      // Attach user to request
      (request as any).user = {
        userId: payload.sub,
        username: payload.username,
        email: payload.email,
        roles: payload.roles,
      };

      return true;
    } catch (error) {
      logger.warn({ error: error.message }, 'JWT verification failed');
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return undefined;
    }

    // Support both "Bearer <token>" and just "<token>"
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }

    return undefined;
  }
}

