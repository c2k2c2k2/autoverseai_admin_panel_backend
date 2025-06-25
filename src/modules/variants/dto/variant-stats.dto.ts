export class VariantStatsDto {
    total: number;
    active: number;
    inactive: number;
    discontinued: number;
    outOfStock: number;
    available: number;
    withDiscount: number;
    byBrand: Record<string, number>;
    byCar: Record<string, number>;
    byTransmission: Record<string, number>;
    byDriveType: Record<string, number>;
    priceRange: {
        min: number;
        max: number;
        average: number;
    };
}