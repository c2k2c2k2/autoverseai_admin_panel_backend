import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { License } from './entities/license.entity';
import { LicenseBrand } from './entities/license-brand.entity';
import { UsersModule } from '../users/users.module';
import { LicenseTypesModule } from '../license-types/license-types.module';
import { BrandsModule } from '../brands/brands.module';
import { EmailModule } from '../../common/modules/email.module';
import { PasswordGeneratorService } from '../../common/services/password-generator.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([License, LicenseBrand]),
        UsersModule,
        LicenseTypesModule,
        BrandsModule,
        EmailModule,
        forwardRef(() => AuthModule),
    ],
    controllers: [LicensesController],
    providers: [LicensesService, PasswordGeneratorService],
    exports: [LicensesService],
})
export class LicensesModule { }
