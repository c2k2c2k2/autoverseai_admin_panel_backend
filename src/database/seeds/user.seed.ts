import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';

export class SeedUsers {
    static async run(dataSource: DataSource): Promise<void> {
        const userRepository = dataSource.getRepository(User);

        // Check if admin user already exists
        const existingAdmin = await userRepository.findOne({
            where: { email: 'admin@example.com' }
        });

        if (existingAdmin) {
            console.log('👤 Admin user already exists, skipping user seeding');
            return;
        }

        const users = [
            {
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                emailVerifiedAt: new Date(),
            },
            {
                email: 'user@example.com',
                firstName: 'Regular',
                lastName: 'User',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                emailVerifiedAt: new Date(),
            },
            {
                email: 'testuser1@example.com',
                firstName: 'Test',
                lastName: 'User One',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                emailVerifiedAt: new Date(),
            },
            {
                email: 'testuser2@example.com',
                firstName: 'Test',
                lastName: 'User Two',
                role: UserRole.USER,
                status: UserStatus.PENDING,
            },
        ];

        for (const userData of users) {
            const user = userRepository.create(userData);
            await userRepository.save(user);
            console.log(`👤 Created user: ${userData.email}`);
        }

        console.log('✅ User seeding completed');
    }
}