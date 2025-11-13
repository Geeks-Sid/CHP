import { ApiProperty } from '@nestjs/swagger';

export class PresignResponseDto {
    @ApiProperty({
        description: 'Upload ID (use this in confirm endpoint)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    upload_id: string;

    @ApiProperty({
        description: 'Presigned PUT URL for uploading the file',
        example: 'https://s3.amazonaws.com/bucket/key?X-Amz-Algorithm=...',
    })
    url: string;

    @ApiProperty({
        description: 'Additional form fields (if using POST form upload)',
        required: false,
    })
    fields?: Record<string, string>;

    @ApiProperty({
        description: 'URL expiration timestamp',
        example: '2024-01-15T10:15:00.000Z',
    })
    expires_at: Date;
}

