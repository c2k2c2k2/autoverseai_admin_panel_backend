import { Global, Module } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { PasswordGeneratorService } from '../services/password-generator.service';
import { EmailModule } from './email.module';

@Global()
@Module({
    imports: [EmailModule],
    providers: [EmailService, PasswordGeneratorService],
    exports: [EmailService, PasswordGeneratorService],
})
export class CommonModule { }