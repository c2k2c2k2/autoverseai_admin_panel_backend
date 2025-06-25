import { LicenseResponseDto } from "./license-response.dto";

export class LicenseValidationResponseDto {
    valid: boolean;
    message?: string;
    license?: LicenseResponseDto;
}