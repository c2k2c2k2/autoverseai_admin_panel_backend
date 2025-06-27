import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { LicensesModule } from '../licenses/licenses.module';
import { CarsModule } from '../cars/cars.module';
import { BrandsModule } from '../brands/brands.module';
import { VariantsModule } from '../variants/variants.module';
import { LicenseTypesModule } from '../license-types/license-types.module';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        LicensesModule,
        CarsModule,
        BrandsModule,
        VariantsModule,
        LicenseTypesModule,
    ],
    controllers: [StatsController],
    providers: [StatsService],
    exports: [StatsService],
})
export class StatsModule { }
