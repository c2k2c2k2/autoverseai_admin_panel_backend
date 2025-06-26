import { Exclude, Expose, Type } from 'class-transformer';
import { CarStatus, CarType, FuelType } from '../entities/car.entity';
import { BrandResponseDto } from '../../brands/dto/brand-response.dto';

export class CarResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  description?: string;

  @Expose()
  status: CarStatus;

  @Expose()
  type: CarType;

  @Expose()
  fuelTypes: FuelType[];

  @Expose()
  launchYear?: number;

  @Expose()
  discontinuedYear?: number;

  @Expose()
  startingPrice?: number;

  @Expose()
  currency: string;

  @Expose()
  imageUrl?: string;

  @Expose()
  imageUrls?: string[];

  @Expose()
  sortOrder: number;

  @Expose()
  specifications?: Record<string, any>;

  @Expose()
  features?: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => BrandResponseDto)
  brand?: BrandResponseDto;

  @Expose()
  get isActive(): boolean {
    return this.status === CarStatus.ACTIVE;
  }

  @Expose()
  get isDiscontinued(): boolean {
    return this.status === CarStatus.DISCONTINUED;
  }

  @Expose()
  get displayName(): string {
    return `${this.brand?.name || ''} ${this.name}`.trim();
  }

  @Expose()
  get primaryImageUrl(): string {
    return this.imageUrl || this.imageUrls?.[0] || '';
  }

  // Exclude sensitive fields
  // @Exclude()
  @Expose()
  brandId: string;

  @Exclude()
  metadata?: Record<string, any>;

  @Exclude()
  deletedAt?: Date;
}
