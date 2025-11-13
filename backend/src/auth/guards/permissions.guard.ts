import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { FastifyRequest } from 'fastify';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { logger } from '../../common/logger/logger.config';

/**
 * Permissions Guard
 * Checks if user has required permissions
 * Must be used after JwtAuthGuard
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as any).user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user permissions from database
    const userPermissions = await this.getUserPermissions(user.userId);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      logger.warn(
        {
          userId: user.userId,
          required: requiredPermissions,
          has: Array.from(userPermissions),
        },
        'Permission check failed',
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  /**
   * Get user permissions from database
   * Returns a Set for O(1) lookup
   */
  private async getUserPermissions(userId: string): Promise<Set<string>> {
    const { rows } = await this.databaseService.query<{ permission_name: string }>(
      `SELECT p.permission_name
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE ur.user_id = $1`,
      [userId],
    );

    return new Set(rows.map((r) => r.permission_name));
  }
}

