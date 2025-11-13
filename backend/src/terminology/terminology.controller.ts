import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ConceptBatchRequestDto } from './dto/concept-response.dto';
import { ConceptListResponseDto, ConceptResponseDto } from './dto/concept-response.dto';
import { ConceptSearchQueryDto } from './dto/concept-search.dto';
import { TerminologyService } from './terminology.service';

@ApiTags('Terminology')
@Controller('terminology')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TerminologyController {
    constructor(private readonly terminologyService: TerminologyService) { }

    @Get('concepts')
    @Permissions('fhir.read') // Using fhir.read permission as terminology is often used for FHIR
    @ApiOperation({ summary: 'Search concepts with filters' })
    @ApiQuery({ name: 'q', required: false, type: String, description: 'Text search query' })
    @ApiQuery({ name: 'code', required: false, type: String, description: 'Exact concept code' })
    @ApiQuery({ name: 'system', required: false, enum: ['SNOMED', 'ICD10', 'RXNORM', 'LOINC'], description: 'Vocabulary system' })
    @ApiQuery({ name: 'vocabulary_id', required: false, type: String, description: 'Vocabulary ID' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiResponse({ status: 200, description: 'Concepts list', type: ConceptListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchConcepts(
        @Query() query: ConceptSearchQueryDto,
    ): Promise<ConceptListResponseDto> {
        return this.terminologyService.searchConcepts({
            q: query.q,
            code: query.code,
            system: query.system,
            vocabulary_id: query.vocabulary_id,
            limit: query.limit,
            cursor: query.cursor,
        });
    }

    @Post('concepts/batch')
    @Permissions('fhir.read')
    @ApiOperation({ summary: 'Batch lookup concepts by IDs or codes' })
    @ApiResponse({ status: 200, description: 'Concepts found', type: [ConceptResponseDto] })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async batchLookup(
        @Body() batchRequest: ConceptBatchRequestDto,
    ): Promise<ConceptResponseDto[]> {
        return this.terminologyService.batchLookup(batchRequest);
    }
}

