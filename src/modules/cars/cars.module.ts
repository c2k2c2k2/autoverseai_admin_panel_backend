import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { Car } from './entities/car.entity';
import { BrandsModule } from '../brands/brands.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Car]),
        BrandsModule,
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [CarsController],
    providers: [CarsService],
    exports: [CarsService],
})
export class CarsModule { }
