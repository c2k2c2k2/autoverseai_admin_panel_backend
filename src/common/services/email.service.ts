import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface LicenseEmailData {
    userEmail: string;
    userName: string;
    licenseKey: string;
    accessPassword: string;
    downloadUrls: { platform: string; url: string; }[];
    licenseType: string;
    brands: string[];
    expiresAt?: Date;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(
        private mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    async sendLicenseAssignmentEmail(data: LicenseEmailData): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: data.userEmail,
                subject: 'License Assignment - Access Your New License',
                template: 'license-assignment',
                context: {
                    userName: data.userName,
                    licenseKey: data.licenseKey,
                    accessPassword: data.accessPassword,
                    downloadUrls: data.downloadUrls,
                    licenseType: data.licenseType,
                    brands: data.brands,
                    expiresAt: data.expiresAt,
                    supportEmail: this.configService.get('email.from'),
                    companyName: 'Autoverse AI',
                },
            });

            this.logger.log(`License assignment email sent to: ${data.userEmail}`);
        } catch (error) {
            this.logger.error(
                `Failed to send license assignment email to ${data.userEmail}:`,
                error.stack,
            );
            throw new Error('Failed to send license assignment email');
        }
    }

    async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: userEmail,
                subject: 'Welcome to Our Platform',
                template: 'welcome',
                context: {
                    userName,
                    loginUrl: this.configService.get('app.frontendUrl'),
                    supportEmail: this.configService.get('email.from'),
                },
            });

            this.logger.log(`Welcome email sent to: ${userEmail}`);
        } catch (error) {
            this.logger.error(
                `Failed to send welcome email to ${userEmail}:`,
                error.stack,
            );
            throw new Error('Failed to send welcome email');
        }
    }

    async sendLicenseExpiryNotification(
        userEmail: string,
        userName: string,
        licenseKey: string,
        daysUntilExpiry: number,
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: userEmail,
                subject: `License Expiry Notice - ${daysUntilExpiry} days remaining`,
                template: 'license-expiry',
                context: {
                    userName,
                    licenseKey,
                    daysUntilExpiry,
                    supportEmail: this.configService.get('email.from'),
                },
            });

            this.logger.log(`License expiry notification sent to: ${userEmail}`);
        } catch (error) {
            this.logger.error(
                `Failed to send license expiry notification to ${userEmail}:`,
                error.stack,
            );
            throw new Error('Failed to send license expiry notification');
        }
    }
}