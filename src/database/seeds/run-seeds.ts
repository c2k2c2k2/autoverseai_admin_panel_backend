import { DataSource } from 'typeorm';
import typeormConfig from '../../config/typeorm.config';
import { SeedUsers } from './user.seed';
import { SeedBrands } from './brand.seed';
import { SeedLicenseTypes } from './license-type.seed';
import { SeedCars } from './car.seed';
import { SeedVariants } from './variant.seed';
import { SeedLicenses } from './license.seed';

async function runSeeds() {
    const dataSource = await typeormConfig.initialize();

    try {
        console.log('🌱 Starting database seeding...');

        // Run seeds in order due to dependencies
        await SeedUsers.run(dataSource);
        await SeedBrands.run(dataSource);
        await SeedLicenseTypes.run(dataSource);
        await SeedCars.run(dataSource);
        await SeedVariants.run(dataSource);
        await SeedLicenses.run(dataSource);

        console.log('✅ Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}

runSeeds();
