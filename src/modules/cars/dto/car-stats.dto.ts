export class CarStatsDto {
    total: number;
    active: number;
    inactive: number;
    discontinued: number;
    upcoming: number;
    withVariants: number;
    withoutVariants: number;
    byBrand: Record<string, number>;
    byType: Record<string, number>;
    byFuelType: Record<string, number>;
}