import { ApiProperty } from '@nestjs/swagger';
import { MedicationResponseDto } from '../../medications/dto/medication-response.dto';

export class PrescriptionResponseDto extends MedicationResponseDto {
    @ApiProperty({
        description: 'Prescription status',
        example: 'Pending',
        enum: ['Pending', 'Filled', 'Cancelled'],
        required: false,
    })
    prescription_status?: string;

    @ApiProperty({
        description: 'User ID of the clinician who prescribed',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: false,
    })
    prescribed_by?: string;

    @ApiProperty({
        description: 'User ID of the pharmacist who filled',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: false,
    })
    filled_by?: string;

    @ApiProperty({
        description: 'Timestamp when prescription was filled',
        example: '2024-01-15T14:30:00.000Z',
        required: false,
    })
    filled_at?: Date;

    @ApiProperty({
        description: 'Unique prescription number',
        example: 'RX-2024-000123',
        required: false,
    })
    prescription_number?: string;

    // Additional fields for frontend display
    @ApiProperty({
        description: 'Patient name (joined from person table)',
        example: 'John Doe',
        required: false,
    })
    patient_name?: string;

    @ApiProperty({
        description: 'Medication name (from concept table)',
        example: 'Amoxicillin',
        required: false,
    })
    medication_name?: string;

    @ApiProperty({
        description: 'Prescriber name (from users table)',
        example: 'Dr. Michael',
        required: false,
    })
    prescriber_name?: string;
}

export class PrescriptionListResponseDto {
    @ApiProperty({ type: [PrescriptionResponseDto] })
    items: PrescriptionResponseDto[];

    @ApiProperty({ example: 'eyJkcnVnX2V4cG9zdXJlX2lkIjozMjF9', required: false })
    nextCursor?: string;
}

