import { DataSource } from 'typeorm';
import { License, LicenseStatus } from '../../modules/licenses/entities/license.entity';
import { User } from '../../modules/users/entities/user.entity';
import { LicenseType } from '../../modules/license-types/entities/license-type.entity';

export class SeedLicenses {
    static async run(dataSource: DataSource): Promise<void> {
        const licenseRepository = dataSource.getRepository(License);
        const userRepository = dataSource.getRepository(User);
        const licenseTypeRepository = dataSource.getRepository(LicenseType);

        // Check if licenses already exist
        const existingLicenses = await licenseRepository.count();
        if (existingLicenses > 0) {
            console.log('🔑 Licenses already exist, skipping license seeding');
            return;
        }

        // Get users and license types to associate with licenses
        const users = await userRepository.find();
        const licenseTypes = await licenseTypeRepository.find();

        if (users.length === 0) {
            console.log('❌ No users found. Please run user seeder first.');
            return;
        }

        if (licenseTypes.length === 0) {
            console.log('❌ No license types found. Please run license type seeder first.');
            return;
        }

        // Helper function to safely get user and license type
        const getUserByEmail = (email: string): User => {
            const user = users.find(u => u.email === email);
            if (!user) {
                throw new Error(`User with email "${email}" not found`);
            }
            return user;
        };

        const getLicenseTypeByCode = (code: string): LicenseType => {
            const licenseType = licenseTypes.find(lt => lt.code === code);
            if (!licenseType) {
                throw new Error(`License type with code "${code}" not found`);
            }
            return licenseType;
        };

        // Calculate expiry dates
        const now = new Date();
        const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const licenses = [
            {
                userId: getUserByEmail('admin@example.com').id,
                licenseTypeId: getLicenseTypeByCode('ENTERPRISE').id,
                accessPassword: 'admin123',
                status: LicenseStatus.ACTIVE,
                activatedAt: now,
                expiresAt: oneYearFromNow,
                maxAccessCount: 0, // Unlimited
                maxDevices: 10,
                notes: 'Admin enterprise license with full access',
                emailSent: true,
                emailSentAt: now,
                assignedBy: getUserByEmail('admin@example.com').id,
                assignedAt: now,
                assignmentReason: 'Initial admin setup',
            },
            {
                userId: getUserByEmail('user@example.com').id,
                licenseTypeId: getLicenseTypeByCode('STANDALONE').id,
                accessPassword: 'user123',
                status: LicenseStatus.ACTIVE,
                activatedAt: now,
                expiresAt: oneYearFromNow,
                maxAccessCount: 1000,
                maxDevices: 3,
                notes: 'Regular user standalone license',
                emailSent: true,
                emailSentAt: now,
                assignedBy: getUserByEmail('admin@example.com').id,
                assignedAt: now,
                assignmentReason: 'Standard user license assignment',
            },
            {
                userId: getUserByEmail('testuser1@example.com').id,
                licenseTypeId: getLicenseTypeByCode('META_QUEST').id,
                accessPassword: 'test123',
                status: LicenseStatus.ACTIVE,
                activatedAt: now,
                expiresAt: sixMonthsFromNow,
                maxAccessCount: 500,
                maxDevices: 2,
                notes: 'Test user Meta Quest license',
                emailSent: true,
                emailSentAt: now,
                assignedBy: getUserByEmail('admin@example.com').id,
                assignedAt: now,
                assignmentReason: 'Testing purposes',
            },
            {
                userId: getUserByEmail('testuser2@example.com').id,
                licenseTypeId: getLicenseTypeByCode('VISION_PRO').id,
                accessPassword: 'test456',
                status: LicenseStatus.PENDING_ACTIVATION,
                expiresAt: oneMonthFromNow,
                maxAccessCount: 100,
                maxDevices: 1,
                notes: 'Pending activation for Vision Pro license',
                emailSent: false,
                assignedBy: getUserByEmail('admin@example.com').id,
                assignedAt: now,
                assignmentReason: 'Trial license for testing',
            },
        ];

        for (const licenseData of licenses) {
            const license = licenseRepository.create(licenseData);
            await licenseRepository.save(license);

            const user = users.find(u => u.id === licenseData.userId);
            const licenseType = licenseTypes.find(lt => lt.id === licenseData.licenseTypeId);
            console.log(`🔑 Created license: ${licenseType?.name} for ${user?.email}`);
        }

        console.log('✅ License seeding completed');
    }
}
