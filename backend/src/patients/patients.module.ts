import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [PatientsController],
    providers: [PatientsService, PatientsRepository],
    exports: [PatientsService, PatientsRepository],
})
export class PatientsModule { }

