import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { logger } from './common/logger/logger.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
    logger.info('Starting bootstrap...');
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({
            logger: false,
            bodyLimit: parseInt(process.env.MAX_PAYLOAD_SIZE || '1048576', 10), // 1MB default
        }),
    );
    logger.info('Nest application created');

    // Configure Fastify JSON parser to prevent prototype pollution
    // TODO: Re-enable custom parser after fixing the duplicate registration issue
    // For now, using Fastify's default parser
    /*
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.removeContentTypeParser('application/json');
    fastifyInstance.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
        try {
            const json = JSON.parse(body as string, (key, value) => {
                if (key === '__proto__' || key === 'constructor') {
                    throw new Error('Prototype pollution attempt detected');
                }
                return value;
            });
            done(null, json);
        } catch (error: any) {
            done(error, undefined);
        }
    });
    */

    logger.info('Skipping Swagger setup for now...');
    // Swagger/OpenAPI documentation - temporarily disabled to debug startup
    // TODO: Re-enable Swagger after fixing the hanging issue
    /*
    const config = new DocumentBuilder()
        .setTitle('Hospital Management System API')
        .setDescription('Backend API for Hospital Management System')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth',
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    */
    logger.info('Swagger setup skipped');

    // Request ID middleware - register via Fastify hook
    logger.info('Setting up middleware...');
    const requestIdMiddleware = new RequestIdMiddleware();
    app.getHttpAdapter().getInstance().addHook('onRequest', (request: any, reply: any, done: any) => {
        requestIdMiddleware.use(request, reply, done);
    });
    
    // Security headers - register via Fastify hook to avoid type issues
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.addHook('onRequest', (request: any, reply: any, done: any) => {
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Strict-Transport-Security (HSTS) - only in production with HTTPS
        if (isProduction && request.protocol === 'https') {
            reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');
        reply.header('X-XSS-Protection', '1; mode=block');
        reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
        reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()');
        
        done();
    });
    
    // Correlation middleware - register via Fastify hook
    const { CorrelationService } = await import('./telemetry/services/correlation.service');
    const correlationService = app.get(CorrelationService);
    fastifyInstance.addHook('onRequest', (request: any, reply: any, done: any) => {
        const context = correlationService.extractFromRequest(request);
        reply.header('X-Trace-ID', context.traceId);
        reply.header('X-Request-ID', context.requestId);
        correlationService.runWithContext(context, () => {
            done();
        });
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());
    logger.info('Middleware setup complete');

    // CORS
    logger.info('Setting up CORS...');
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });

    // API prefix
    app.setGlobalPrefix('api/v1');
    logger.info('Configuration complete');

    const port = process.env.PORT || 3000;
    logger.info({ port }, 'About to start listening...');
    await app.listen(port, '0.0.0.0');

    logger.info({ port }, 'Application started');
}

bootstrap();

