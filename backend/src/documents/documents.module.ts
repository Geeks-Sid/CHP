import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { S3Service } from './s3/s3.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [DocumentsController],
    providers: [DocumentsService, DocumentsRepository, S3Service],
    exports: [DocumentsService, DocumentsRepository, S3Service],
})
export class DocumentsModule { }

