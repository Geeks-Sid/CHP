import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { DocumentsModule } from './documents/documents.module';
import { SecurityModule } from './security/security.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { MedicationsModule } from './medications/medications.module';
import { PatientsModule } from './patients/patients.module';
import { FhirModule } from './fhir/fhir.module';
import { ProceduresModule } from './procedures/procedures.module';
import { ReportsModule } from './reports/reports.module';
import { TerminologyModule } from './terminology/terminology.module';
import { UsersModule } from './users/users.module';
import { VisitsModule } from './visits/visits.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (global default)
      },
    ]),
    DatabaseModule,
    HealthModule,
    SecurityModule,
    TelemetryModule,
    FeatureFlagsModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    VisitsModule,
    ProceduresModule,
    MedicationsModule,
    DocumentsModule,
    TerminologyModule,
    FhirModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
