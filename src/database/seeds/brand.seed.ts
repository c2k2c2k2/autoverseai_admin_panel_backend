import { DataSource } from 'typeorm';
import { Brand, BrandStatus } from '../../modules/brands/entities/brand.entity';

export class SeedBrands {
    static async run(dataSource: DataSource): Promise<void> {
        const brandRepository = dataSource.getRepository(Brand);

        // Check if brands already exist
        const existingBrands = await brandRepository.count();
        if (existingBrands > 0) {
            console.log('🏷️ Brands already exist, skipping brand seeding');
            return;
        }

        const brands = [
            {
                name: 'Hyundai',
                slug: 'hyundai',
                description: 'South Korean multinational automotive manufacturer',
                status: BrandStatus.ACTIVE,
                primaryColor: '#0066CC',
                secondaryColor: '#FFFFFF',
                countryCode: 'KOR',
                sortOrder: 1,
            },
            {
                name: 'Mahindra',
                slug: 'mahindra',
                description: 'Indian multinational automotive manufacturing corporation',
                status: BrandStatus.ACTIVE,
                primaryColor: '#C41E3A',
                secondaryColor: '#FFFFFF',
                countryCode: 'IND',
                sortOrder: 2,
            },
            {
                name: 'Toyota',
                slug: 'toyota',
                description: 'Japanese multinational automotive manufacturer',
                status: BrandStatus.ACTIVE,
                primaryColor: '#EB0A1E',
                secondaryColor: '#FFFFFF',
                countryCode: 'JPN',
                sortOrder: 3,
            },
            {
                name: 'Honda',
                slug: 'honda',
                description: 'Japanese public multinational conglomerate corporation',
                status: BrandStatus.ACTIVE,
                primaryColor: '#E60012',
                secondaryColor: '#FFFFFF',
                countryCode: 'JPN',
                sortOrder: 4,
            },
            {
                name: 'BMW',
                slug: 'bmw',
                description: 'German multinational automotive manufacturer',
                status: BrandStatus.ACTIVE,
                primaryColor: '#1C69D4',
                secondaryColor: '#FFFFFF',
                countryCode: 'DEU',
                sortOrder: 5,
            },
        ];

        for (const brandData of brands) {
            const brand = brandRepository.create(brandData);
            await brandRepository.save(brand);
            console.log(`🏷️ Created brand: ${brandData.name}`);
        }

        console.log('✅ Brand seeding completed');
    }
}