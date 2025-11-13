import {
    Controller,
    Get,
    Header,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { FhirService } from './fhir.service';

@ApiTags('FHIR')
@Controller('fhir/R4')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FhirController {
    constructor(private readonly fhirService: FhirService) { }

    @Get('Patient/:id')
    @Permissions('fhir.read')
    @Header('Content-Type', 'application/fhir+json')
    @ApiOperation({ summary: 'Get FHIR Patient resource by person ID' })
    @ApiParam({ name: 'id', description: 'Person ID', type: Number })
    @ApiResponse({ status: 200, description: 'FHIR Patient resource' })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getPatient(
        @Param('id', ParseIntPipe) personId: number,
        @Query('baseUrl') baseUrl?: string,
    ): Promise<any> {
        const base = baseUrl || 'http://localhost:3000';
        return this.fhirService.getPatient(personId, base);
    }

    @Get('Patient')
    @Permissions('fhir.read')
    @Header('Content-Type', 'application/fhir+json')
    @ApiOperation({ summary: 'Search FHIR Patient by identifier (MRN)' })
    @ApiQuery({ name: 'identifier', required: false, description: 'MRN identifier' })
    @ApiResponse({ status: 200, description: 'FHIR Patient resource' })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchPatient(
        @Query('identifier') identifier?: string,
        @Query('baseUrl') baseUrl?: string,
    ): Promise<any> {
        if (!identifier) {
            // Return empty Bundle for now (full search implementation would require Bundle response)
            return {
                resourceType: 'Bundle',
                type: 'searchset',
                total: 0,
                entry: [],
            };
        }

        // Extract MRN from identifier (format: system|value or just value)
        const mrn = identifier.includes('|') ? identifier.split('|')[1] : identifier;
        const base = baseUrl || 'http://localhost:3000';
        const patient = await this.fhirService.getPatientByMRN(mrn, base);

        // Return as Bundle for search results
        return {
            resourceType: 'Bundle',
            type: 'searchset',
            total: 1,
            entry: [
                {
                    resource: patient,
                },
            ],
        };
    }

    @Get('Encounter/:id')
    @Permissions('fhir.read')
    @Header('Content-Type', 'application/fhir+json')
    @ApiOperation({ summary: 'Get FHIR Encounter resource by visit ID' })
    @ApiParam({ name: 'id', description: 'Visit occurrence ID', type: Number })
    @ApiResponse({ status: 200, description: 'FHIR Encounter resource' })
    @ApiResponse({ status: 404, description: 'Encounter not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getEncounter(
        @Param('id', ParseIntPipe) visitId: number,
        @Query('baseUrl') baseUrl?: string,
    ): Promise<any> {
        const base = baseUrl || 'http://localhost:3000';
        return this.fhirService.getEncounter(visitId, base);
    }
}

