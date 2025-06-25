import {
    IsEmail,
    IsUUID,
    IsArray,
    IsOptional,
    IsString,
    ArrayMinSize,
    MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AssignLicenseDto {
    @IsEmail()
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @IsUUID()
    licenseTypeId: string;

    @IsArray()
    @IsUUID(undefined, { each: true })
    @ArrayMinSize(1)
    brandIds: string[];

    @IsOptional()
    @IsUUID()
    assignedBy?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    assignmentReason?: string;
}