import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { logger } from '../../common/logger/logger.config';

/**
 * PHI Redaction Interceptor
 * Redacts PII/PHI from logs and error responses
 * Prevents sensitive data leakage
 */
@Injectable()
export class PhiRedactionInterceptor implements NestInterceptor {
    private readonly phiFields = [
        'password',
        'password_hash',
        'passwordHash',
        'token',
        'access_token',
        'refresh_token',
        'secret',
        'api_key',
        'apikey',
        'ssn',
        'social_security_number',
        'credit_card',
        'card_number',
        'email', // Can be redacted in logs but shown in responses
        'phone',
        'phone_number',
        'mrn', // Medical Record Number - may need to redact in logs
        'first_name',
        'last_name',
        'dob',
        'date_of_birth',
        'birth_datetime',
    ];

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Redact sensitive data from request body in logs
        if (request.body) {
            const redactedBody = this.redactSensitiveData(request.body);
            logger.debug(
                {
                    method: request.method,
                    url: request.url,
                    body: redactedBody,
                },
                'Request received',
            );
        }

        return next.handle().pipe(
            map((data) => {
                // In production, you might want to redact certain fields from responses
                // For now, we only redact in logs
                return data;
            }),
        );
    }

    /**
     * Recursively redact sensitive fields from an object
     */
    private redactSensitiveData(obj: any): any {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.redactSensitiveData(item));
        }

        const redacted: any = {};

        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();

            // Check if this field should be redacted
            if (this.phiFields.some((field) => lowerKey.includes(field))) {
                redacted[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                redacted[key] = this.redactSensitiveData(value);
            } else {
                redacted[key] = value;
            }
        }

        return redacted;
    }
}

