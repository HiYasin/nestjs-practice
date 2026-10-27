import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dtos/pagination-query.dto.js';
import { ObjectLiteral, Repository } from 'typeorm';
import { IPaginated } from '../interface/paginated.interface.js';

@Injectable()
export class PaginationProvider {
    public async paginateQuery<T extends ObjectLiteral>(
        paginationQuery: PaginationQueryDto,
        repository: Repository<T>
    ): Promise<IPaginated<T>> {
        const { page = 1, limit = 10 } = paginationQuery;
        const data = await repository.find({
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalItems = await repository.count();
        const totalPages = await Math.ceil(totalItems/limit);

        const response: IPaginated<T> = {
            data,
            meta: {
                itemsPerPage: limit,
                totalItems,
                totalPages,
                currentPage: page
            }
        }
        return response;
    }
}
