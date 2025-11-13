import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    Min,
    ValidateNested
} from 'class-validator';
import { ContactDto } from './contact.dto';

export class UpdatePatientDto {
    @ApiProperty({
        description: 'First name',
        example: 'John',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    first_name?: string;

    @ApiProperty({
        description: 'Last name',
        example: 'Doe',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    last_name?: string;

    @ApiProperty({
        description: 'Gender concept ID',
        example: 8507,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    gender_concept_id?: number;

    @ApiProperty({
        description: 'Date of birth (YYYY-MM-DD)',
        example: '1980-05-15',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    dob?: string;

    @ApiProperty({
        description: 'Race concept ID',
        example: 8527,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    race_concept_id?: number;

    @ApiProperty({
        description: 'Ethnicity concept ID',
        example: 38003564,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    ethnicity_concept_id?: number;

    @ApiProperty({
        description: 'Person source value',
        example: 'imported',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    person_source_value?: string;

    @ApiProperty({
        description: 'Contact information',
        type: ContactDto,
        required: false,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => ContactDto)
    contact?: ContactDto;
}

