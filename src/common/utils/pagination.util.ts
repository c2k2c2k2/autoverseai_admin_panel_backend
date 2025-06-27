import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

export class PaginationUtil {
    static async paginate<T extends ObjectLiteral>(
        queryBuilder: SelectQueryBuilder<T>,
        paginationDto: PaginationDto,
    ): Promise<PaginatedResult<T>> {
        const { page = 1, limit = 10 } = paginationDto;

        const skip = (page - 1) * limit;

        const [data, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
}