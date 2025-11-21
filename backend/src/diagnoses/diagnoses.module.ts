import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DiagnosesController } from './diagnoses.controller';
import { DiagnosesRepository } from './diagnoses.repository';
import { DiagnosesService } from './diagnoses.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [DiagnosesController],
    providers: [DiagnosesService, DiagnosesRepository],
    exports: [DiagnosesService, DiagnosesRepository],
})
export class DiagnosesModule { }

