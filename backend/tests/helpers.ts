import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

/**
 * Test helper utilities
 */

/**
 * Create a test user in the database
 */
export async function createTestUser(
  pool: Pool,
  options: {
    username?: string;
    email?: string;
    password?: string;
    roleNames?: string[];
    active?: boolean;
  } = {},
): Promise<{ userId: string; username: string; email: string }> {
  const username = options.username || `testuser_${Date.now()}`;
  const email = options.email || `${username}@test.com`;
  const password = options.password || 'TestPassword123!';
  const active = options.active !== undefined ? options.active : true;

  const passwordHash = await bcrypt.hash(password, 12);

  const userResult = await pool.query(
    `INSERT INTO users (username, email, password_hash, active)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, username, email`,
    [username, email, passwordHash, active],
  );

  const userId = userResult.rows[0].user_id;

  // Assign roles if provided
  if (options.roleNames && options.roleNames.length > 0) {
    for (const roleName of options.roleNames) {
      const roleResult = await pool.query(
        `SELECT role_id FROM roles WHERE role_name = $1`,
        [roleName],
      );

      if (roleResult.rows.length > 0) {
        await pool.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [userId, roleResult.rows[0].role_id],
        );
      }
    }
  }

  return {
    userId,
    username: userResult.rows[0].username,
    email: userResult.rows[0].email,
  };
}

/**
 * Create a test patient (person) in the database
 */
export async function createTestPatient(
  pool: Pool,
  options: {
    firstName?: string;
    lastName?: string;
    genderConceptId?: number;
    yearOfBirth?: number;
    monthOfBirth?: number;
    dayOfBirth?: number;
    mrn?: string;
  } = {},
): Promise<{ personId: number; mrn: string }> {
  const firstName = options.firstName || 'Test';
  const lastName = options.lastName || 'Patient';
  const genderConceptId = options.genderConceptId || 8507; // Male
  const yearOfBirth = options.yearOfBirth || 1980;
  const monthOfBirth = options.monthOfBirth || 1;
  const dayOfBirth = options.dayOfBirth || 1;
  const seqNum = String(Math.floor(Math.random() * 1000000));
  const mrn = options.mrn || `MRN-${yearOfBirth}-${seqNum.padStart(6, '0')}`;

  const result = await pool.query(
    `INSERT INTO person (
      first_name, last_name, gender_concept_id,
      year_of_birth, month_of_birth, day_of_birth,
      birth_datetime, mrn
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING person_id, mrn`,
    [
      firstName,
      lastName,
      genderConceptId,
      yearOfBirth,
      monthOfBirth,
      dayOfBirth,
      new Date(yearOfBirth, monthOfBirth - 1, dayOfBirth).toISOString(),
      mrn,
    ],
  );

  return {
    personId: result.rows[0].person_id,
    mrn: result.rows[0].mrn,
  };
}

/**
 * Create a test visit
 */
export async function createTestVisit(
  pool: Pool,
  options: {
    personId: number;
    visitType?: string;
    visitStart?: Date;
    visitEnd?: Date;
    visitConceptId?: number;
    providerId?: string;
  },
): Promise<{ visitOccurrenceId: number; visitNumber: string }> {
  const visitType = options.visitType || 'OPD';
  const visitStart = options.visitStart || new Date();
  const visitEnd = options.visitEnd || null;
  const visitConceptId = options.visitConceptId || 9201; // Outpatient visit
  const seqNum = String(Math.floor(Math.random() * 1000000));
  const visitNumber = `V-${new Date().getFullYear()}-${seqNum.padStart(6, '0')}`;

  const result = await pool.query(
    `INSERT INTO visit_occurrence (
      person_id, visit_concept_id, visit_start, visit_end,
      visit_type, provider_id, visit_number
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING visit_occurrence_id, visit_number`,
    [
      options.personId,
      visitConceptId,
      visitStart.toISOString(),
      visitEnd ? visitEnd.toISOString() : null,
      visitType,
      options.providerId || null,
      visitNumber,
    ],
  );

  return {
    visitOccurrenceId: result.rows[0].visit_occurrence_id,
    visitNumber: result.rows[0].visit_number,
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(pool: Pool): Promise<void> {
  // Delete in reverse order of dependencies
  await pool.query('DELETE FROM drug_exposure');
  await pool.query('DELETE FROM procedure_occurrence');
  await pool.query('DELETE FROM visit_occurrence');
  await pool.query('DELETE FROM document');
  await pool.query('DELETE FROM person');
  await pool.query('DELETE FROM refresh_tokens');
  await pool.query('DELETE FROM user_roles');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM audit_log');
}

/**
 * Get JWT token for a test user
 */
export async function getAuthToken(
  pool: Pool,
  username: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  // This would normally call the auth service
  // For testing, we'll create a simple token
  const userResult = await pool.query(
    `SELECT user_id, username, email, password_hash FROM users WHERE username = $1`,
    [username],
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid password');
  }

  // Get user roles
  const rolesResult = await pool.query(
    `SELECT r.role_name
     FROM user_roles ur
     JOIN roles r ON r.role_id = ur.role_id
     WHERE ur.user_id = $1`,
    [user.user_id],
  );

  const roles = rolesResult.rows.map((r) => r.role_name);

  // Create a simple JWT (in real tests, use the actual JWT service)
  const secret = process.env.JWT_SECRET || 'test-secret-key-that-is-at-least-32-characters-long';
  
  const accessToken = jwt.sign(
    {
      sub: user.user_id,
      username: user.username,
      email: user.email,
      roles,
      iss: 'hospital-ms-test',
    },
    secret,
    { expiresIn: '15m' },
  );

  const refreshToken = randomBytes(64).toString('hex');

  return { accessToken, refreshToken };
}

/**
 * Wait for a specified amount of time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random string
 */
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate a random email
 */
export function randomEmail(): string {
  return `${randomString()}@test.com`;
}

