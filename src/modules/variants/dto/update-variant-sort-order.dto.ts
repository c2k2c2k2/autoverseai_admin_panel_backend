import { IsArray, ValidateNested, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class VariantSortOrderItem {
    @IsUUID()
    id: string;

    @IsNumber()
    @Min(0)
    sortOrder: number;
}

export class UpdateVariantSortOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantSortOrderItem)
    items: VariantSortOrderItem[];
}