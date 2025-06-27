import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from '../services/email.service';
import { join } from 'path';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('email.host'),
                    port: configService.get<number>('email.port'),
                    secure: configService.get<number>('email.port') === 465, // true for 465, false for other ports
                    auth: {
                        user: configService.get<string>('email.user'),
                        pass: configService.get<string>('email.pass'),
                    },
                },
                defaults: {
                    from: configService.get<string>('email.from'),
                },
                template: {
                    dir: join(__dirname, '../../templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
