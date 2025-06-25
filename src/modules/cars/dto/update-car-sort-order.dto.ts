import { IsArray, ValidateNested, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CarSortOrderItem {
    @IsUUID()
    id: string;

    @IsNumber()
    @Min(0)
    sortOrder: number;
}

export class UpdateCarSortOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CarSortOrderItem)
    items: CarSortOrderItem[];
}