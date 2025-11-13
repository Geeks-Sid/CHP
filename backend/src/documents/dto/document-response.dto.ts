import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    document_id: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    owner_user_id: string;

    @ApiProperty({ example: 123, required: false })
    patient_person_id?: number;

    @ApiProperty({ example: 's3://documents/2024/01/550e8400-e29b-41d4-a716-446655440000/report.pdf' })
    file_path: string;

    @ApiProperty({ example: 'report.pdf', required: false })
    file_name?: string;

    @ApiProperty({ example: 'application/pdf', required: false })
    content_type?: string;

    @ApiProperty({ example: 12345, required: false })
    size_bytes?: number;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
    uploaded_by?: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    uploaded_at: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z', required: false })
    deleted_at?: Date;
}

export class DocumentWithDownloadUrlDto extends DocumentResponseDto {
    @ApiProperty({
        description: 'Presigned GET URL for downloading the file (expires in 1 hour)',
        example: 'https://s3.amazonaws.com/bucket/key?X-Amz-Algorithm=...',
        required: false,
    })
    download_url?: string;
}

export class DocumentListResponseDto {
    @ApiProperty({ type: [DocumentResponseDto] })
    items: DocumentResponseDto[];

    @ApiProperty({ example: 'eyJ1cGxvYWRlZF9hdCI6IjIwMjQtMDEtMTVUMTA6MDA6MDAuMDAwWiIsImRvY3VtZW50X2lkIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIn0=', required: false })
    nextCursor?: string;
}

