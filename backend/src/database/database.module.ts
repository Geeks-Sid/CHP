import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'DATABASE_POOL',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return new Pool({
                    host: configService.get<string>('PGHOST'),
                    port: configService.get<number>('PGPORT'),
                    database: configService.get<string>('PGDATABASE'),
                    user: configService.get<string>('PGUSER'),
                    password: configService.get<string>('PGPASSWORD'),
                    ssl: configService.get<string>('PGSSL') === 'true' ? { rejectUnauthorized: false } : undefined,
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                });
            },
        },
        DatabaseService,
    ],
    exports: ['DATABASE_POOL', DatabaseService],
})
export class DatabaseModule { }

