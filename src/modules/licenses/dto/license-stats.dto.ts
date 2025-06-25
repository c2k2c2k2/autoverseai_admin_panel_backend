export class LicenseStatsDto {
    total: number;
    active: number;
    inactive: number;
    expired: number;
    suspended: number;
    revoked: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
    byLicenseType: Record<string, number>;
}