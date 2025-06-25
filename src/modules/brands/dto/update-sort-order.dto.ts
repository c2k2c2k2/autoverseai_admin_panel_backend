import { IsArray, ValidateNested, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class SortOrderItem {
    @IsUUID()
    id: string;

    @IsNumber()
    @Min(0)
    sortOrder: number;
}

export class UpdateSortOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SortOrderItem)
    items: SortOrderItem[];
}