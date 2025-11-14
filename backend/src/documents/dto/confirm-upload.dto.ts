import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class ConfirmUploadDto {
    @ApiProperty({
        description: 'Upload ID from presign response',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    upload_id: string;

    @ApiProperty({
        description: 'S3 file path (key) where the file was uploaded (optional - backend will use stored path if not provided)',
        example: 'documents/2024/01/550e8400-e29b-41d4-a716-446655440000/report.pdf',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    file_path?: string;

    @ApiProperty({
        description: 'Patient person ID',
        example: 123,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    patient_person_id?: number;

    @ApiProperty({
        description: 'Document type (e.g., Lab Result, Prescription, Physical Exam, Vaccination)',
        example: 'Lab Result',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    document_type?: string;

    @ApiProperty({
        description: 'Optional description or notes about the document',
        example: 'Annual checkup report',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiProperty({
        description: 'SHA-256 checksum of the file (optional, for verification)',
        example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    checksum?: string;
}

