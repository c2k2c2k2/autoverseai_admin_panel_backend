import { ApiProperty } from '@nestjs/swagger';

export class OverviewStatsDto {
    @ApiProperty({
        description: 'User statistics',
        example: {
            total: 100,
            active: 80,
            inactive: 15,
            pending: 5,
            admins: 2,
            recentSignups: 10
        }
    })
    users: {
        total: number;
        active: number;
        inactive: number;
        pending: number;
        admins: number;
        recentSignups: number;
    };

    @ApiProperty({
        description: 'License statistics',
        example: {
            total: 50,
            active: 40,
            expired: 5,
            revoked: 5,
            recentlyIssued: 10,
            expiringThisMonth: 3
        }
    })
    licenses: {
        total: number;
        active: number;
        expired: number;
        revoked: number;
        recentlyIssued: number;
        expiringThisMonth: number;
    };

    @ApiProperty({
        description: 'Car statistics',
        example: {
            total: 200,
            active: 180,
            inactive: 20,
            byBrand: {},
            byType: {}
        }
    })
    cars: {
        total: number;
        active: number;
        inactive: number;
        byBrand: Record<string, number>;
        byType: Record<string, number>;
    };

    @ApiProperty({
        description: 'Brand statistics',
        example: {
            total: 15,
            active: 12,
            inactive: 3,
            withCars: 10
        }
    })
    brands: {
        total: number;
        active: number;
        inactive: number;
        withCars: number;
    };

    @ApiProperty({
        description: 'Variant statistics',
        example: {
            total: 500,
            active: 450,
            inactive: 50,
            averagePrice: 25000
        }
    })
    variants: {
        total: number;
        active: number;
        inactive: number;
        averagePrice: number;
    };

    @ApiProperty({
        description: 'License type statistics',
        example: {
            total: 5,
            active: 4,
            inactive: 1,
            mostUsed: 'Premium'
        }
    })
    licenseTypes: {
        total: number;
        active: number;
        inactive: number;
        mostUsed: string;
    };

    @ApiProperty({
        description: 'Revenue statistics',
        example: {
            totalRevenue: 125000,
            monthlyRevenue: 15000,
            growthRate: 12.5
        }
    })
    revenue: {
        totalRevenue: number;
        monthlyRevenue: number;
        growthRate: number;
    };

    @ApiProperty({
        description: 'Monthly trend data for charts',
        example: [
            { month: 'January', users: 100, licenses: 50, revenue: 10000 },
            { month: 'February', users: 120, licenses: 60, revenue: 12000 }
        ]
    })
    monthlyTrends: Array<{
        month: string;
        users: number;
        licenses: number;
        revenue: number;
    }>;
}
