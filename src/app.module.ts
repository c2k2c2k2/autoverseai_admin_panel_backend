import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Configuration
import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';

// Common modules
import { CommonModule } from './common/modules/common.module';
import { AuthModule } from './auth/auth.module';

// Feature modules
import { UsersModule } from './modules/users/users.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CarsModule } from './modules/cars/cars.module';
import { VariantsModule } from './modules/variants/variants.module';
import { LicenseTypesModule } from './modules/license-types/license-types.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { StatsModule } from './modules/stats/stats.module';

// Guards, filters, interceptors
import { ClerkAuthGuard } from './auth/guards/clerk-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: 3,
          },
          {
            name: 'medium',
            ttl: 10000, // 10 seconds
            limit: 20,
          },
          {
            name: 'long',
            ttl: 60000, // 1 minute
            limit: 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Common modules
    CommonModule,
    AuthModule,

    // Feature modules
    UsersModule,
    BrandsModule,
    CarsModule,
    VariantsModule,
    LicenseTypesModule,
    LicensesModule,
    StatsModule,
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },

    // Global filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule { }
