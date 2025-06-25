import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordGeneratorService {
    private readonly uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private readonly lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    private readonly numberChars = '0123456789';
    private readonly specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    generatePassword(
        length: number = 12,
        options: {
            includeUppercase?: boolean;
            includeLowercase?: boolean;
            includeNumbers?: boolean;
            includeSpecialChars?: boolean;
        } = {},
    ): string {
        const {
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSpecialChars = false,
        } = options;

        let chars = '';
        if (includeUppercase) chars += this.uppercaseChars;
        if (includeLowercase) chars += this.lowercaseChars;
        if (includeNumbers) chars += this.numberChars;
        if (includeSpecialChars) chars += this.specialChars;

        if (!chars) {
            throw new Error('At least one character type must be included');
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return password;
    }

    generateSecurePassword(): string {
        return this.generatePassword(16, {
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSpecialChars: true,
        });
    }

    generateUserFriendlyPassword(): string {
        return this.generatePassword(12, {
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSpecialChars: false,
        });
    }
}