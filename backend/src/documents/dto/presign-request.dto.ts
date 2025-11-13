import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PresignRequestDto {
    @ApiProperty({
        description: 'File name',
        example: 'report.pdf',
    })
    @IsString()
    @MaxLength(255)
    file_name: string;

    @ApiProperty({
        description: 'Content type (MIME type)',
        example: 'application/pdf',
    })
    @IsString()
    @MaxLength(100)
    content_type: string;

    @ApiProperty({
        description: 'File size in bytes',
        example: 12345,
    })
    @IsInt()
    @Min(1)
    @Max(100 * 1024 * 1024) // 100MB max
    size_bytes: number;

    @ApiProperty({
        description: 'Patient person ID (optional)',
        example: 123,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    patient_person_id?: number;
}

