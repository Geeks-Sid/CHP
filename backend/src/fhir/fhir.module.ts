import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MedicationsModule } from '../medications/medications.module';
import { PatientsModule } from '../patients/patients.module';
import { ProceduresModule } from '../procedures/procedures.module';
import { VisitsModule } from '../visits/visits.module';
import { FhirController } from './fhir.controller';
import { FhirService } from './fhir.service';

@Module({
    imports: [
        DatabaseModule,
        AuthModule,
        PatientsModule,
        VisitsModule,
        ProceduresModule,
        MedicationsModule,
    ],
    controllers: [FhirController],
    providers: [FhirService],
    exports: [FhirService],
})
export class FhirModule { }

