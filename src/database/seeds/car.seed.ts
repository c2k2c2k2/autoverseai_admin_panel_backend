import { DataSource } from 'typeorm';
import { Car, CarStatus, CarType, FuelType } from '../../modules/cars/entities/car.entity';
import { Brand } from '../../modules/brands/entities/brand.entity';

export class SeedCars {
    static async run(dataSource: DataSource): Promise<void> {
        const carRepository = dataSource.getRepository(Car);
        const brandRepository = dataSource.getRepository(Brand);

        // Check if cars already exist
        const existingCars = await carRepository.count();
        if (existingCars > 0) {
            console.log('🚗 Cars already exist, skipping car seeding');
            return;
        }

        // Get brands to associate with cars
        const brands = await brandRepository.find();
        if (brands.length === 0) {
            console.log('❌ No brands found. Please run brand seeder first.');
            return;
        }

        const brandMap = new Map(brands.map(brand => [brand.slug, brand]));

        // Helper function to safely get brand ID
        const getBrandId = (slug: string): string => {
            const brand = brandMap.get(slug);
            if (!brand) {
                throw new Error(`Brand with slug "${slug}" not found`);
            }
            return brand.id;
        };

        const cars = [
            {
                name: 'Creta',
                slug: 'creta',
                brandId: getBrandId('hyundai'),
                description: 'Popular mid-size SUV with modern features',
                status: CarStatus.ACTIVE,
                type: CarType.SUV,
                fuelTypes: [FuelType.PETROL, FuelType.DIESEL],
                launchYear: 2020,
                startingPrice: 15000,
                currency: 'USD',
                specifications: {
                    length: '4300mm',
                    width: '1790mm',
                    height: '1635mm',
                    wheelbase: '2610mm',
                },
                sortOrder: 1,
            },
            {
                name: 'Thar',
                slug: 'thar',
                brandId: getBrandId('mahindra'),
                description: 'Iconic off-road SUV with powerful performance',
                status: CarStatus.ACTIVE,
                type: CarType.SUV,
                fuelTypes: [FuelType.PETROL, FuelType.DIESEL],
                launchYear: 2020,
                startingPrice: 20000,
                currency: 'USD',
                specifications: {
                    length: '3985mm',
                    width: '1855mm',
                    height: '1920mm',
                    wheelbase: '2450mm',
                },
                sortOrder: 1,
            },
            {
                name: 'Camry',
                slug: 'camry',
                brandId: getBrandId('toyota'),
                description: 'Luxury sedan with hybrid technology',
                status: CarStatus.ACTIVE,
                type: CarType.SEDAN,
                fuelTypes: [FuelType.HYBRID],
                launchYear: 2021,
                startingPrice: 35000,
                currency: 'USD',
                specifications: {
                    length: '4885mm',
                    width: '1840mm',
                    height: '1445mm',
                    wheelbase: '2825mm',
                },
                sortOrder: 1,
            },
            {
                name: 'City',
                slug: 'city',
                brandId: getBrandId('honda'),
                description: 'Popular mid-size sedan with excellent fuel efficiency',
                status: CarStatus.ACTIVE,
                type: CarType.SEDAN,
                fuelTypes: [FuelType.PETROL, FuelType.HYBRID],
                launchYear: 2021,
                startingPrice: 25000,
                currency: 'USD',
                specifications: {
                    length: '4549mm',
                    width: '1748mm',
                    height: '1489mm',
                    wheelbase: '2600mm',
                },
                sortOrder: 1,
            },
            {
                name: 'X5',
                slug: 'x5',
                brandId: getBrandId('bmw'),
                description: 'Luxury SUV with premium features',
                status: CarStatus.ACTIVE,
                type: CarType.SUV,
                fuelTypes: [FuelType.PETROL, FuelType.DIESEL, FuelType.HYBRID],
                launchYear: 2021,
                startingPrice: 65000,
                currency: 'USD',
                specifications: {
                    length: '4922mm',
                    width: '2004mm',
                    height: '1745mm',
                    wheelbase: '2975mm',
                },
                sortOrder: 1,
            },
        ];

        for (const carData of cars) {
            const car = carRepository.create(carData);
            await carRepository.save(car);
            const brand = brands.find(b => b.id === carData.brandId);
            console.log(`🚗 Created car: ${carData.name} (${brand?.name || 'Unknown Brand'})`);
        }

        console.log('✅ Car seeding completed');
    }
}
