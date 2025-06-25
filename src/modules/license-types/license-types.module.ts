import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseTypesService } from './license-types.service';
import { LicenseTypesController } from './license-types.controller';
import { LicenseType } from './entities/license-type.entity';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([LicenseType]),
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [LicenseTypesController],
    providers: [LicenseTypesService],
    exports: [LicenseTypesService],
})
export class LicenseTypesModule { }
