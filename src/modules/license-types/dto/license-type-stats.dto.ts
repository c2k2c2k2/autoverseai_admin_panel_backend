import { PlatformType } from '../entities/license-type.entity';

export class LicenseTypeStatsDto {
    total: number;
    active: number;
    inactive: number;
    deprecated: number;
    withLicenses: number;
    withoutLicenses: number;
    byPlatform: Record<PlatformType, number>;
}