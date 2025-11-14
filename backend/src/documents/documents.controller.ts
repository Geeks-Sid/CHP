import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { DocumentListResponseDto, DocumentResponseDto, DocumentWithDownloadUrlDto } from './dto/document-response.dto';
import { PresignRequestDto } from './dto/presign-request.dto';
import { PresignResponseDto } from './dto/presign-response.dto';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post('presign')
    @Permissions('document.upload')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get presigned URL for file upload' })
    @ApiResponse({ status: 200, description: 'Presigned URL generated', type: PresignResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async presignUpload(
        @CurrentUser() user: any,
        @Body() presignRequestDto: PresignRequestDto,
    ): Promise<PresignResponseDto> {
        return this.documentsService.presignUpload(user.userId, presignRequestDto);
    }

    @Post('confirm')
    @Permissions('document.upload')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Confirm file upload and create document record' })
    @ApiResponse({ status: 201, description: 'Document created', type: DocumentResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error or upload expired' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Upload ID not found' })
    async confirmUpload(
        @CurrentUser() user: any,
        @Body() confirmUploadDto: ConfirmUploadDto,
    ): Promise<DocumentResponseDto> {
        return this.documentsService.confirmUpload(user.userId, confirmUploadDto);
    }

    @Get(':document_id')
    @Permissions('document.read')
    @ApiOperation({ summary: 'Get document by ID with download URL' })
    @ApiResponse({ status: 200, description: 'Document found', type: DocumentWithDownloadUrlDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    async getDocument(
        @CurrentUser() user: any,
        @Param('document_id') documentId: string,
    ): Promise<DocumentWithDownloadUrlDto> {
        const userRoles = user.roles || [];
        const result = await this.documentsService.getDocument(documentId, user.userId, userRoles);
        return {
            ...result.document,
            download_url: result.download_url,
        };
    }

    @Get()
    @Permissions('document.read')
    @ApiOperation({ summary: 'List documents with filters' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiQuery({ name: 'patient_person_id', required: false, type: Number, description: 'Filter by patient ID' })
    @ApiQuery({ name: 'owner_user_id', required: false, type: String, description: 'Filter by owner user ID (requires document.read permission)' })
    @ApiQuery({ name: 'document_type', required: false, type: String, description: 'Filter by document type (e.g., Lab Result, Prescription)' })
    @ApiResponse({ status: 200, description: 'Documents list', type: DocumentListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async listDocuments(
        @CurrentUser() user: any,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('patient_person_id') patient_person_id?: string,
        @Query('owner_user_id') owner_user_id?: string,
        @Query('document_type') document_type?: string,
    ): Promise<DocumentListResponseDto> {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const patientPersonId = patient_person_id ? parseInt(patient_person_id, 10) : undefined;
        const userRoles = user.roles || [];

        return this.documentsService.searchDocuments(user.userId, userRoles, {
            limit: limitNum,
            cursor,
            patient_person_id: patientPersonId,
            owner_user_id: owner_user_id,
            document_type: document_type,
        });
    }

    @Delete(':document_id')
    @Permissions('document.delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete document (soft delete)' })
    @ApiResponse({ status: 204, description: 'Document deleted' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    async deleteDocument(
        @CurrentUser() user: any,
        @Param('document_id') documentId: string,
    ): Promise<void> {
        const userRoles = user.roles || [];
        await this.documentsService.deleteDocument(documentId, user.userId, userRoles);
    }
}

