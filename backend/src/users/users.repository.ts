import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { logger } from '../common/logger/logger.config';

export interface CreateUserData {
  username: string;
  email: string;
  password_hash: string;
  role_ids?: number[];
}

export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  active?: boolean;
  role_ids?: number[];
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithRoles extends User {
  roles: string[];
}

export interface PaginationParams {
  limit: number;
  cursor?: string;
  offset?: number;
}

export interface UserFilters {
  role?: string;
  active?: boolean;
  search?: string;
}

/**
 * Users Repository
 * Handles all database operations for users
 * Uses transactions for data consistency
 */
@Injectable()
export class UsersRepository {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Create a new user with roles
   * Uses transaction to ensure atomicity
   */
  async createUser(data: CreateUserData): Promise<User> {
    return this.databaseService.withTransaction(async (client: PoolClient) => {
      // Check for existing username or email
      const existing = await client.query(
        `SELECT user_id FROM users WHERE username = $1 OR email = $2`,
        [data.username, data.email],
      );

      if (existing.rows.length > 0) {
        const conflict = existing.rows[0];
        const { rows: userRows } = await client.query(
          `SELECT username, email FROM users WHERE user_id = $1`,
          [conflict.user_id],
        );
        const user = userRows[0];
        if (user.username === data.username) {
          throw new Error('USERNAME_EXISTS');
        }
        if (user.email === data.email) {
          throw new Error('EMAIL_EXISTS');
        }
      }

      // Insert user
      const { rows } = await client.query<User>(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING user_id, username, email, active, created_at, updated_at`,
        [data.username, data.email, data.password_hash],
      );

      const user = rows[0];

      // Assign roles if provided
      if (data.role_ids && data.role_ids.length > 0) {
        for (const roleId of data.role_ids) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [user.user_id, roleId],
          );
        }
      }

      logger.debug({ userId: user.user_id, username: user.username }, 'User created');
      return user;
    });
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<UserWithRoles | null> {
    const { rows } = await this.databaseService.query<User>(
      `SELECT user_id, username, email, active, created_at, updated_at
       FROM users
       WHERE user_id = $1`,
      [userId],
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    const roles = await this.getUserRoles(userId);

    return {
      ...user,
      roles,
    };
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const { rows } = await this.databaseService.query<User>(
      `SELECT user_id, username, email, active, created_at, updated_at
       FROM users
       WHERE username = $1`,
      [username],
    );

    return rows[0] || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.databaseService.query<User>(
      `SELECT user_id, username, email, active, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email],
    );

    return rows[0] || null;
  }

  /**
   * Update user
   * Uses transaction to ensure atomicity
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    return this.databaseService.withTransaction(async (client: PoolClient) => {
      // Check if email is being changed and if it conflicts
      if (data.email) {
        const { rows } = await client.query(
          `SELECT user_id FROM users WHERE email = $1 AND user_id != $2`,
          [data.email, userId],
        );

        if (rows.length > 0) {
          throw new Error('EMAIL_EXISTS');
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }

      if (data.password_hash !== undefined) {
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(data.password_hash);
      }

      if (data.active !== undefined) {
        updates.push(`active = $${paramIndex++}`);
        values.push(data.active);
      }

      if (updates.length === 0) {
        // No updates, just return existing user
        const user = await this.findById(userId);
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }
        return user;
      }

      values.push(userId);

      const { rows } = await client.query<User>(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE user_id = $${paramIndex}
         RETURNING user_id, username, email, active, created_at, updated_at`,
        values,
      );

      if (rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      // Update roles if provided
      if (data.role_ids !== undefined) {
        // Remove all existing roles
        await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);

        // Add new roles
        if (data.role_ids.length > 0) {
          for (const roleId of data.role_ids) {
            await client.query(
              `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
              [userId, roleId],
            );
          }
        }
      }

      logger.debug({ userId }, 'User updated');
      return rows[0];
    });
  }

  /**
   * Delete user (soft delete by setting active = false)
   * Or hard delete if needed
   */
  async deleteUser(userId: string, hardDelete: boolean = false): Promise<void> {
    if (hardDelete) {
      // Hard delete - cascades to user_roles and refresh_tokens
      const { rowCount } = await this.databaseService.query(
        `DELETE FROM users WHERE user_id = $1`,
        [userId],
      );

      if (rowCount === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      logger.info({ userId }, 'User hard deleted');
    } else {
      // Soft delete
      await this.updateUser(userId, { active: false });
      logger.info({ userId }, 'User soft deleted (deactivated)');
    }
  }

  /**
   * List users with pagination and filters
   */
  async listUsers(
    pagination: PaginationParams,
    filters?: UserFilters,
  ): Promise<{ users: UserWithRoles[]; nextCursor?: string; total?: number }> {
    const { limit, cursor, offset } = pagination;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Cursor-based pagination
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const cursorData = JSON.parse(decoded);
        conditions.push(`created_at < $${paramIndex++}`);
        params.push(new Date(cursorData.created_at));
      } catch (error) {
        logger.warn({ error, cursor }, 'Invalid cursor');
      }
    }

    // Filters
    if (filters?.role) {
      conditions.push(
        `user_id IN (
          SELECT user_id FROM user_roles ur
          JOIN roles r ON r.role_id = ur.role_id
          WHERE r.role_name = $${paramIndex++}
        )`,
      );
      params.push(filters.role);
    }

    if (filters?.active !== undefined) {
      conditions.push(`active = $${paramIndex++}`);
      params.push(filters.active);
    }

    if (filters?.search) {
      conditions.push(
        `(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`,
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get users
    params.push(limit + 1); // Fetch one extra to check if there's a next page
    const { rows } = await this.databaseService.query<User>(
      `SELECT user_id, username, email, active, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      params,
    );

    const hasMore = rows.length > limit;
    const users = hasMore ? rows.slice(0, limit) : rows;

    // Get roles for each user
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      users.map(async (user) => {
        const roles = await this.getUserRoles(user.user_id);
        return { ...user, roles };
      }),
    );

    // Generate next cursor
    let nextCursor: string | undefined;
    if (hasMore && users.length > 0) {
      const lastUser = users[users.length - 1];
      const cursorData = {
        created_at: lastUser.created_at.toISOString(),
        user_id: lastUser.user_id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    return {
      users: usersWithRoles,
      nextCursor,
    };
  }

  /**
   * Get user roles
   */
  private async getUserRoles(userId: string): Promise<string[]> {
    const { rows } = await this.databaseService.query<{ role_name: string }>(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId],
    );

    return rows.map((r) => r.role_name);
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Array<{ role_id: number; role_name: string; description: string | null }>> {
    const { rows } = await this.databaseService.query<{
      role_id: number;
      role_name: string;
      description: string | null;
    }>(
      `SELECT role_id, role_name, description FROM roles ORDER BY role_name`,
      [],
    );

    return rows;
  }
}

