import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ConfirmUploadDto {
    @ApiProperty({
        description: 'Upload ID from presign response',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    upload_id: string;

    @ApiProperty({
        description: 'S3 file path (key) where the file was uploaded',
        example: 's3://documents/2024/01/550e8400-e29b-41d4-a716-446655440000/report.pdf',
    })
    @IsString()
    @MaxLength(1000)
    file_path: string;

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

