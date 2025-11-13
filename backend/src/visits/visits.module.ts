import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { VisitsController } from './visits.controller';
import { VisitsRepository } from './visits.repository';
import { VisitsService } from './visits.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [VisitsController],
    providers: [VisitsService, VisitsRepository],
    exports: [VisitsService, VisitsRepository],
})
export class VisitsModule { }

