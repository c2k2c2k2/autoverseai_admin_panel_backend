import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { Variant } from './entities/variant.entity';
import { BrandsModule } from '../brands/brands.module';
import { CarsModule } from '../cars/cars.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Variant]),
        BrandsModule,
        CarsModule,
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [VariantsController],
    providers: [VariantsService],
    exports: [VariantsService],
})
export class VariantsModule { }
