import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkService {
    private readonly clerkClient;

    constructor(private configService: ConfigService) {
        this.clerkClient = createClerkClient({
            secretKey: this.configService.get<string>('clerk.secretKey'),
        });
    }

    async verifyToken(token: string) {
        try {
            return await this.clerkClient.verifyToken(token);
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    async getUser(userId: string) {
        try {
            return await this.clerkClient.users.getUser(userId);
        } catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }

    async getUserByEmail(email: string) {
        try {
            const users = await this.clerkClient.users.getUserList({
                emailAddress: [email],
            });
            return users.data[0] || null;
        } catch (error) {
            throw new Error(`Failed to get user by email: ${error.message}`);
        }
    }

    async updateUser(userId: string, data: any) {
        try {
            return await this.clerkClient.users.updateUser(userId, data);
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    async deleteUser(userId: string) {
        try {
            return await this.clerkClient.users.deleteUser(userId);
        } catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }

    getClerkClient() {
        return this.clerkClient;
    }
}