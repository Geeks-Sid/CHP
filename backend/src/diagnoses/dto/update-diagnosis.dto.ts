import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { CreateDiagnosisDto } from './create-diagnosis.dto';

export class UpdateDiagnosisDto extends PartialType(CreateDiagnosisDto) {
    @ApiProperty({
        description: 'Condition end date (YYYY-MM-DD) - to mark as resolved',
        example: '2024-02-15',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    condition_end_date?: string;

    @ApiProperty({
        description: 'Is this the principal diagnosis for the visit',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    is_principal_diagnosis?: boolean;
}

