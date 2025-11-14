import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MedicationsModule } from '../medications/medications.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsRepository } from './prescriptions.repository';
import { PrescriptionsService } from './prescriptions.service';

@Module({
    imports: [DatabaseModule, MedicationsModule, InventoryModule],
    controllers: [PrescriptionsController],
    providers: [PrescriptionsService, PrescriptionsRepository],
    exports: [PrescriptionsService],
})
export class PrescriptionsModule { }

