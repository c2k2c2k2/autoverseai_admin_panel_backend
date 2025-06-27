import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LicensesService } from '../licenses/licenses.service';
import { CarsService } from '../cars/cars.service';
import { BrandsService } from '../brands/brands.service';
import { VariantsService } from '../variants/variants.service';
import { LicenseTypesService } from '../license-types/license-types.service';
import { OverviewStatsDto } from './dto/overview-stats.dto';

@Injectable()
export class StatsService {
    constructor(
        private readonly usersService: UsersService,
        private readonly licensesService: LicensesService,
        private readonly carsService: CarsService,
        private readonly brandsService: BrandsService,
        private readonly variantsService: VariantsService,
        private readonly licenseTypesService: LicenseTypesService,
    ) { }

    async getOverviewStats(): Promise<OverviewStatsDto> {
        // Fetch all stats in parallel for better performance
        const [
            userStats,
            licenseStats,
            carStats,
            brandStats,
            variantStats,
            licenseTypeStats,
        ] = await Promise.all([
            this.usersService.getStats(),
            this.licensesService.getStats(),
            this.carsService.getStats(),
            this.brandsService.getStats(),
            this.variantsService.getStats(),
            this.licenseTypesService.getStats(),
        ]);

        // Calculate revenue statistics (mock data for now, can be replaced with real calculations)
        const revenue = {
            totalRevenue: 125000,
            monthlyRevenue: 15000,
            growthRate: 12.5,
        };

        // Generate monthly trends (last 6 months)
        const monthlyTrends = this.generateMonthlyTrends();

        return {
            users: userStats,
            licenses: {
                total: licenseStats.total,
                active: licenseStats.active,
                expired: licenseStats.expired,
                revoked: licenseStats.revoked,
                recentlyIssued: licenseStats.active, // Using active as a proxy for recently issued
                expiringThisMonth: licenseStats.expiringIn30Days,
            },
            cars: {
                total: carStats.total,
                active: carStats.active,
                inactive: carStats.inactive,
                byBrand: carStats.byBrand || {},
                byType: carStats.byType || {},
            },
            brands: brandStats,
            variants: {
                total: variantStats.total,
                active: variantStats.active,
                inactive: variantStats.inactive,
                averagePrice: variantStats.priceRange?.average || 0,
            },
            licenseTypes: {
                total: licenseTypeStats.total,
                active: licenseTypeStats.active,
                inactive: licenseTypeStats.inactive,
                mostUsed: this.getMostUsedLicenseType(licenseStats.byLicenseType),
            },
            revenue,
            monthlyTrends,
        };
    }

    private getMostUsedLicenseType(byLicenseType: Record<string, number>): string {
        if (!byLicenseType || Object.keys(byLicenseType).length === 0) {
            return 'N/A';
        }

        let mostUsed = '';
        let maxCount = 0;

        for (const [type, count] of Object.entries(byLicenseType)) {
            if (count > maxCount) {
                maxCount = count;
                mostUsed = type;
            }
        }

        return mostUsed || 'N/A';
    }

    private generateMonthlyTrends(): Array<{
        month: string;
        users: number;
        licenses: number;
        revenue: number;
    }> {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
        ];

        const currentMonth = new Date().getMonth();
        const trends: Array<{
            month: string;
            users: number;
            licenses: number;
            revenue: number;
        }> = [];

        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            trends.push({
                month: months[monthIndex],
                users: Math.floor(Math.random() * 50) + 100,
                licenses: Math.floor(Math.random() * 30) + 50,
                revenue: Math.floor(Math.random() * 5000) + 10000,
            });
        }

        return trends;
    }
}
