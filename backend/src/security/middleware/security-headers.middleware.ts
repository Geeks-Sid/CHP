import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Security Headers Middleware
 * Sets security headers for all responses
 * Implements HSTS, noSniff, XSS protection, Referrer policy, CSP
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
    use(req: FastifyRequest, res: FastifyReply, next: () => void) {
        const isProduction = process.env.NODE_ENV === 'production';

        // Strict-Transport-Security (HSTS) - only in production with HTTPS
        if (isProduction && req.protocol === 'https') {
            res.header(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload',
            );
        }

        // X-Content-Type-Options: nosniff
        // Prevents MIME type sniffing
        res.header('X-Content-Type-Options', 'nosniff');

        // X-Frame-Options: DENY
        // Prevents clickjacking attacks
        res.header('X-Frame-Options', 'DENY');

        // X-XSS-Protection: 1; mode=block
        // Enables XSS filtering in older browsers
        res.header('X-XSS-Protection', '1; mode=block');

        // Referrer-Policy
        // Controls referrer information sent with requests
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content-Security-Policy (CSP)
        // Restricts resources that can be loaded
        const csp = this.buildCSP();
        res.header('Content-Security-Policy', csp);

        // Permissions-Policy (formerly Feature-Policy)
        // Restricts browser features
        res.header(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
        );

        next();
    }

    /**
     * Build Content Security Policy header
     * Adjust based on your application needs
     */
    private buildCSP(): string {
        const directives: string[] = [];

        // Default source: self only
        directives.push("default-src 'self'");

        // Scripts: self and trusted CDNs (adjust as needed)
        directives.push("script-src 'self' 'unsafe-inline' 'unsafe-eval'"); // Remove unsafe-* in production if possible

        // Styles: self and trusted CDNs
        directives.push("style-src 'self' 'unsafe-inline'");

        // Images: self and data URIs
        directives.push("img-src 'self' data: https:");

        // Fonts: self
        directives.push("font-src 'self'");

        // Connect: self (for API calls)
        directives.push("connect-src 'self'");

        // Frame ancestors: none (prevent embedding)
        directives.push("frame-ancestors 'none'");

        // Base URI: self
        directives.push("base-uri 'self'");

        // Form action: self
        directives.push("form-action 'self'");

        // Upgrade insecure requests in production
        if (process.env.NODE_ENV === 'production') {
            directives.push('upgrade-insecure-requests');
        }

        return directives.join('; ');
    }
}

