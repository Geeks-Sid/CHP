import { HttpStatus, HttpException } from '@nestjs/common';

/**
 * Maps PostgreSQL error codes to HTTP status codes
 */
export function mapDatabaseErrorToHttp(error: any): HttpException {
  const code = error.code;

  // PostgreSQL error codes
  switch (code) {
    case '23505': // unique_violation
      return new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'Resource already exists',
          details: { constraint: error.constraint },
        },
        HttpStatus.CONFLICT,
      );

    case '23503': // foreign_key_violation
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Referenced resource does not exist',
          details: { constraint: error.constraint },
        },
        HttpStatus.BAD_REQUEST,
      );

    case '23502': // not_null_violation
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Required field is missing',
          details: { column: error.column },
        },
        HttpStatus.BAD_REQUEST,
      );

    case '23514': // check_violation
      return new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Data validation failed',
          details: { constraint: error.constraint },
        },
        HttpStatus.BAD_REQUEST,
      );

    case '42P01': // undefined_table
    case '42703': // undefined_column
      return new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Database schema error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    default:
      return new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Database error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }
}

