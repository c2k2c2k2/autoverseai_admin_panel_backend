import { DataSource } from 'typeorm';
import { Variant, VariantStatus, TransmissionType, DriveType } from '../../modules/variants/entities/variant.entity';
import { Car } from '../../modules/cars/entities/car.entity';
import { Brand } from '../../modules/brands/entities/brand.entity';

export class SeedVariants {
    static async run(dataSource: DataSource): Promise<void> {
        const variantRepository = dataSource.getRepository(Variant);
        const carRepository = dataSource.getRepository(Car);
        const brandRepository = dataSource.getRepository(Brand);

        // Check if variants already exist
        const existingVariants = await variantRepository.count();
        if (existingVariants > 0) {
            console.log('🚙 Variants already exist, skipping variant seeding');
            return;
        }

        // Get cars and brands to associate with variants
        const cars = await carRepository.find({ relations: ['brand'] });
        if (cars.length === 0) {
            console.log('❌ No cars found. Please run car seeder first.');
            return;
        }

        const carMap = new Map(cars.map(car => [car.slug, car]));

        // Helper function to safely get car and brand IDs
        const getCarAndBrandIds = (carSlug: string): { carId: string; brandId: string } => {
            const car = carMap.get(carSlug);
            if (!car) {
                throw new Error(`Car with slug "${carSlug}" not found`);
            }
            return { carId: car.id, brandId: car.brandId };
        };

        const variants = [
            // Hyundai Creta variants
            {
                name: 'E 1.5 Petrol',
                ...getCarAndBrandIds('creta'),
                description: 'Base variant with 1.5L petrol engine',
                status: VariantStatus.ACTIVE,
                price: 15000,
                currency: 'USD',
                engineCapacity: '1.5L',
                horsePower: 115,
                torque: 144,
                transmission: TransmissionType.MANUAL,
                driveType: DriveType.FWD,
                fuelEfficiency: 16.8,
                seatingCapacity: 5,
                bootSpace: 433,
                color: 'Polar White',
                colorCode: '#FFFFFF',
                isAvailable: true,
                stockQuantity: 50,
                sortOrder: 1,
            },
            {
                name: 'SX 1.5 Diesel AT',
                ...getCarAndBrandIds('creta'),
                description: 'Top variant with 1.5L diesel engine and automatic transmission',
                status: VariantStatus.ACTIVE,
                price: 18500,
                currency: 'USD',
                engineCapacity: '1.5L',
                horsePower: 115,
                torque: 250,
                transmission: TransmissionType.AUTOMATIC,
                driveType: DriveType.FWD,
                fuelEfficiency: 18.4,
                seatingCapacity: 5,
                bootSpace: 433,
                color: 'Phantom Black',
                colorCode: '#000000',
                isAvailable: true,
                stockQuantity: 30,
                sortOrder: 2,
            },
            // Mahindra Thar variants
            {
                name: 'LX 2.0 Petrol MT',
                ...getCarAndBrandIds('thar'),
                description: 'Base variant with 2.0L petrol engine and manual transmission',
                status: VariantStatus.ACTIVE,
                price: 20000,
                currency: 'USD',
                engineCapacity: '2.0L',
                horsePower: 150,
                torque: 300,
                transmission: TransmissionType.MANUAL,
                driveType: DriveType.FourWD,
                fuelEfficiency: 15.2,
                seatingCapacity: 4,
                bootSpace: 0,
                color: 'Rocky Beige',
                colorCode: '#D2B48C',
                isAvailable: true,
                stockQuantity: 25,
                sortOrder: 1,
            },
            {
                name: 'LX 2.2 Diesel AT',
                ...getCarAndBrandIds('thar'),
                description: 'Premium variant with 2.2L diesel engine and automatic transmission',
                status: VariantStatus.ACTIVE,
                price: 23000,
                currency: 'USD',
                engineCapacity: '2.2L',
                horsePower: 130,
                torque: 320,
                transmission: TransmissionType.AUTOMATIC,
                driveType: DriveType.FourWD,
                fuelEfficiency: 15.2,
                seatingCapacity: 4,
                bootSpace: 0,
                color: 'Mystic Copper',
                colorCode: '#B87333',
                isAvailable: true,
                stockQuantity: 20,
                sortOrder: 2,
            },
            // Toyota Camry variants
            {
                name: 'Hybrid',
                ...getCarAndBrandIds('camry'),
                description: 'Hybrid variant with excellent fuel efficiency',
                status: VariantStatus.ACTIVE,
                price: 35000,
                currency: 'USD',
                engineCapacity: '2.5L',
                horsePower: 218,
                torque: 221,
                transmission: TransmissionType.CVT,
                driveType: DriveType.FWD,
                fuelEfficiency: 23.1,
                seatingCapacity: 5,
                bootSpace: 524,
                color: 'Celestial Silver',
                colorCode: '#C0C0C0',
                isAvailable: true,
                stockQuantity: 15,
                sortOrder: 1,
            },
            // Honda City variants
            {
                name: 'V CVT',
                ...getCarAndBrandIds('city'),
                description: 'Top variant with CVT transmission',
                status: VariantStatus.ACTIVE,
                price: 25000,
                currency: 'USD',
                engineCapacity: '1.5L',
                horsePower: 121,
                torque: 145,
                transmission: TransmissionType.CVT,
                driveType: DriveType.FWD,
                fuelEfficiency: 17.8,
                seatingCapacity: 5,
                bootSpace: 506,
                color: 'Platinum White Pearl',
                colorCode: '#F8F8FF',
                isAvailable: true,
                stockQuantity: 40,
                sortOrder: 1,
            },
            // BMW X5 variants
            {
                name: 'xDrive40i',
                ...getCarAndBrandIds('x5'),
                description: 'Luxury SUV with powerful petrol engine',
                status: VariantStatus.ACTIVE,
                price: 65000,
                currency: 'USD',
                engineCapacity: '3.0L',
                horsePower: 340,
                torque: 450,
                transmission: TransmissionType.AUTOMATIC,
                driveType: DriveType.AWD,
                fuelEfficiency: 12.65,
                seatingCapacity: 7,
                bootSpace: 650,
                color: 'Alpine White',
                colorCode: '#FFFFFF',
                isAvailable: true,
                stockQuantity: 10,
                sortOrder: 1,
            },
            {
                name: 'xDrive30d',
                ...getCarAndBrandIds('x5'),
                description: 'Luxury SUV with efficient diesel engine',
                status: VariantStatus.ACTIVE,
                price: 68000,
                currency: 'USD',
                engineCapacity: '3.0L',
                horsePower: 265,
                torque: 620,
                transmission: TransmissionType.AUTOMATIC,
                driveType: DriveType.AWD,
                fuelEfficiency: 16.55,
                seatingCapacity: 7,
                bootSpace: 650,
                color: 'Mineral Grey',
                colorCode: '#708090',
                isAvailable: true,
                stockQuantity: 8,
                sortOrder: 2,
            },
        ];

        for (const variantData of variants) {
            const variant = variantRepository.create(variantData);
            await variantRepository.save(variant);
            const car = cars.find(c => c.id === variantData.carId);
            console.log(`🚙 Created variant: ${car?.name} ${variantData.name}`);
        }

        console.log('✅ Variant seeding completed');
    }
}
