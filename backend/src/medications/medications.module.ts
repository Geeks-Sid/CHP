import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MedicationsController } from './medications.controller';
import { MedicationsRepository } from './medications.repository';
import { MedicationsService } from './medications.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [MedicationsController],
    providers: [MedicationsService, MedicationsRepository],
    exports: [MedicationsService, MedicationsRepository],
})
export class MedicationsModule { }

