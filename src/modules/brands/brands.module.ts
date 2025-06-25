import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { Brand } from './entities/brand.entity';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Brand]),
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [BrandsController],
    providers: [BrandsService],
    exports: [BrandsService],
})
export class BrandsModule { }
