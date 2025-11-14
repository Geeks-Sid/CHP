import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CreateMedicationDto } from '../../medications/dto/create-medication.dto';

export class CreatePrescriptionDto extends CreateMedicationDto {
    @ApiProperty({
        description: 'Visit occurrence ID (optional)',
        example: 987,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    visit_occurrence_id?: number;
}

