import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { logger } from './common/logger/logger.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({
            logger: false,
            bodyLimit: parseInt(process.env.MAX_PAYLOAD_SIZE || '1048576', 10), // 1MB default
        }),
    );

    // Configure Fastify JSON parser to prevent prototype pollution
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
        try {
            // Parse JSON with reviver to prevent prototype pollution
            const json = JSON.parse(body as string, (key, value) => {
                // Prevent prototype pollution by blocking __proto__ and constructor
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

    // Swagger/OpenAPI documentation
    if (process.env.NODE_ENV !== 'production') {
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
    }

    // Request ID middleware - register via Fastify hook
    const requestIdMiddleware = new RequestIdMiddleware();
    app.getHttpAdapter().getInstance().addHook('onRequest', (request: any, reply: any, done: any) => {
        requestIdMiddleware.use(request, reply, done);
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

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });

    // API prefix
    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');

    logger.info({ port }, 'Application started');
}

bootstrap();

