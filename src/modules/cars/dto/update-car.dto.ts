import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCarDto } from './create-car.dto';

export class UpdateCarDto extends PartialType(
    OmitType(CreateCarDto, ['brandId'] as const),
) { }