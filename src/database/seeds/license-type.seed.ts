import { DataSource } from 'typeorm';
import { LicenseType, LicenseTypeStatus, PlatformType } from '../../modules/license-types/entities/license-type.entity';

export class SeedLicenseTypes {
    static async run(dataSource: DataSource): Promise<void> {
        const licenseTypeRepository = dataSource.getRepository(LicenseType);

        // Check if license types already exist
        const existingLicenseTypes = await licenseTypeRepository.count();
        if (existingLicenseTypes > 0) {
            console.log('📄 License types already exist, skipping license type seeding');
            return;
        }

        const licenseTypes = [
            {
                name: 'Standalone VR Experience',
                code: 'STANDALONE',
                description: 'Standalone VR experience for independent devices',
                status: LicenseTypeStatus.ACTIVE,
                supportedPlatforms: [PlatformType.STANDALONE],
                downloadUrl: 'https://example.com/download/standalone',
                version: '1.0.0',
                maxUsers: null, // Unlimited
                validityDays: 365, // 1 year
                requiresActivation: true,
                allowMultipleDevices: true,
                maxDevices: 3,
                price: 299.99,
                currency: 'USD',
                sortOrder: 1,
                systemRequirements: {
                    minStorage: '2GB',
                    minRAM: '4GB',
                    supportedDevices: ['Oculus Quest', 'Pico', 'HTC Vive']
                },
                features: [
                    'High-quality VR experience',
                    'Multi-brand support',
                    'Offline mode',
                    'Regular updates'
                ],
                tags: ['VR', 'Standalone', 'Premium']
            },
            {
                name: 'Meta Quest Experience',
                code: 'META_QUEST',
                description: 'Optimized experience for Meta Quest devices',
                status: LicenseTypeStatus.ACTIVE,
                supportedPlatforms: [PlatformType.META_QUEST],
                downloadUrl: 'https://example.com/download/meta-quest',
                version: '2.1.0',
                maxUsers: null,
                validityDays: 365,
                requiresActivation: true,
                allowMultipleDevices: true,
                maxDevices: 2,
                price: 399.99,
                currency: 'USD',
                sortOrder: 2,
                systemRequirements: {
                    minStorage: '3GB',
                    minRAM: '6GB',
                    supportedDevices: ['Meta Quest 2', 'Meta Quest 3', 'Meta Quest Pro']
                },
                features: [
                    'Meta Quest optimized',
                    'Hand tracking support',
                    'Passthrough mode',
                    'Social features'
                ],
                tags: ['VR', 'Meta Quest', 'Premium']
            },
            {
                name: 'Apple Vision Pro Experience',
                code: 'VISION_PRO',
                description: 'Premium experience designed for Apple Vision Pro',
                status: LicenseTypeStatus.ACTIVE,
                supportedPlatforms: [PlatformType.VISION_PRO],
                downloadUrl: 'https://example.com/download/vision-pro',
                version: '1.5.0',
                maxUsers: null,
                validityDays: 365,
                requiresActivation: true,
                allowMultipleDevices: true,
                maxDevices: 1,
                price: 999.99,
                currency: 'USD',
                sortOrder: 3,
                systemRequirements: {
                    minStorage: '5GB',
                    minRAM: '16GB',
                    supportedDevices: ['Apple Vision Pro']
                },
                features: [
                    'Ultra-high resolution',
                    'Eye tracking',
                    'Spatial computing',
                    'Premium materials library'
                ],
                tags: ['AR', 'VR', 'Apple', 'Premium', 'Spatial Computing']
            },
            {
                name: 'Enterprise Multi-Platform',
                code: 'ENTERPRISE',
                description: 'Enterprise solution supporting multiple platforms',
                status: LicenseTypeStatus.ACTIVE,
                supportedPlatforms: [
                    PlatformType.STANDALONE,
                    PlatformType.META_QUEST,
                    PlatformType.VISION_PRO,
                    PlatformType.WINDOWS
                ],
                downloadUrl: 'https://example.com/download/enterprise',
                version: '3.0.0',
                maxUsers: 100,
                validityDays: 365,
                requiresActivation: true,
                allowMultipleDevices: true,
                maxDevices: 10,
                price: 4999.99,
                currency: 'USD',
                sortOrder: 4,
                systemRequirements: {
                    minStorage: '10GB',
                    minRAM: '8GB',
                    supportedDevices: ['Multiple VR/AR devices', 'Windows PC']
                },
                features: [
                    'Multi-platform support',
                    'Enterprise dashboard',
                    'Analytics and reporting',
                    'Custom branding',
                    'Priority support'
                ],
                tags: ['Enterprise', 'Multi-platform', 'Analytics', 'Custom']
            },
        ];

        for (const licenseTypeData of licenseTypes) {
            const licenseType = licenseTypeRepository.create(licenseTypeData as any);
            await licenseTypeRepository.save(licenseType);
            console.log(`📄 Created license type: ${licenseTypeData.name}`);
        }

        console.log('✅ License type seeding completed');
    }
}