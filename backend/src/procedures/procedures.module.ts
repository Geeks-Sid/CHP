import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ProceduresController } from './procedures.controller';
import { ProceduresRepository } from './procedures.repository';
import { ProceduresService } from './procedures.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [ProceduresController],
    providers: [ProceduresService, ProceduresRepository],
    exports: [ProceduresService, ProceduresRepository],
})
export class ProceduresModule { }

