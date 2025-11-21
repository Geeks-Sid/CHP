import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { DiagnosesModule } from './diagnoses/diagnoses.module';
import { DocumentsModule } from './documents/documents.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { FhirModule } from './fhir/fhir.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { MedicationsModule } from './medications/medications.module';
import { PatientsModule } from './patients/patients.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ProceduresModule } from './procedures/procedures.module';
import { ReportsModule } from './reports/reports.module';
import { SecurityModule } from './security/security.module';
import { TelemetryModule } from './telemetry/telemetry.module';
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
    DiagnosesModule,
    MedicationsModule,
    PrescriptionsModule,
    DocumentsModule,
    TerminologyModule,
    FhirModule,
    ReportsModule,
    InventoryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
