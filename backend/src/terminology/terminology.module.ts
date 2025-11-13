import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { TerminologyController } from './terminology.controller';
import { TerminologyRepository } from './terminology.repository';
import { TerminologyService } from './terminology.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [TerminologyController],
    providers: [TerminologyService, TerminologyRepository],
    exports: [TerminologyService, TerminologyRepository],
})
export class TerminologyModule { }

