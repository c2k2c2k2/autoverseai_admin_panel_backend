import { Exclude, Expose, Type } from 'class-transformer';
import {
  VariantStatus,
  TransmissionType,
  DriveType,
} from '../entities/variant.entity';
import { BrandResponseDto } from '../../brands/dto/brand-response.dto';
import { CarResponseDto } from '../../cars/dto/car-response.dto';

export class VariantResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  status: VariantStatus;

  @Expose()
  price: number;

  @Expose()
  currency: string;

  @Expose()
  discountedPrice?: number;

  @Expose()
  engineCapacity?: string;

  @Expose()
  horsePower?: number;

  @Expose()
  torque?: number;

  @Expose()
  transmission?: TransmissionType;

  @Expose()
  driveType?: DriveType;

  @Expose()
  fuelEfficiency?: number;

  @Expose()
  seatingCapacity?: number;

  @Expose()
  bootSpace?: number;

  @Expose()
  color?: string;

  @Expose()
  colorCode?: string;

  @Expose()
  imageUrl?: string;

  @Expose()
  imageUrls?: string[];

  @Expose()
  sortOrder: number;

  @Expose()
  isAvailable: boolean;

  @Expose()
  stockQuantity: number;

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
  @Type(() => CarResponseDto)
  car?: CarResponseDto;

  @Expose()
  get isActive(): boolean {
    return this.status === VariantStatus.ACTIVE && this.isAvailable;
  }

  @Expose()
  get isDiscontinued(): boolean {
    return this.status === VariantStatus.DISCONTINUED;
  }

  @Expose()
  get displayName(): string {
    return `${this.car?.displayName || ''} ${this.name}`.trim();
  }

  @Expose()
  get effectivePrice(): number {
    return this.discountedPrice || this.price;
  }

  @Expose()
  get hasDiscount(): boolean {
    return !!this.discountedPrice && this.discountedPrice < this.price;
  }

  @Expose()
  get discountPercentage(): number {
    if (!this.hasDiscount) return 0;
    const price = Number(this.price);
    const discountedPrice = Number(this.discountedPrice);
    return Math.round(((price - discountedPrice) / price) * 100);
  }

  @Expose()
  get primaryImageUrl(): string {
    return (
      this.imageUrl || this.imageUrls?.[0] || this.car?.primaryImageUrl || ''
    );
  }

  @Expose()
  get inStock(): boolean {
    return this.stockQuantity > 0;
  }

  // Include brandId and carId for frontend compatibility
  @Expose()
  brandId: string;

  @Expose()
  carId: string;

  @Exclude()
  metadata?: Record<string, any>;

  @Exclude()
  deletedAt?: Date;
}
