import {
    IsUUID,
    IsArray,
    IsOptional,
    IsDateString,
    IsString,
    IsNumber,
    ArrayMinSize,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateLicenseDto {
    @IsUUID()
    userId: string;

    @IsUUID()
    licenseTypeId: string;

    @IsArray()
    @IsUUID(undefined, { each: true })
    @ArrayMinSize(1)
    brandIds: string[];

    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;

    @IsOptional()
    @IsUUID()
    assignedBy?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    assignmentReason?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxAccessCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxDevices?: number;
}
