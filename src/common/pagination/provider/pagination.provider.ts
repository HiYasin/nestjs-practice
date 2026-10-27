import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dtos/pagination-query.dto.js';
import {
    FindManyOptions,
    ObjectLiteral,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { IPaginated } from '../interface/paginated.interface.js';

@Injectable()
export class PaginationProvider {
    private readonly defaultLimit = 10;
    private readonly maxLimit = 100;

    public async paginateQuery<T extends ObjectLiteral>(
        paginationQuery: PaginationQueryDto,
        repository: Repository<T>,
        options: FindManyOptions<T> = {},
    ): Promise<IPaginated<T>> {
        const { page, limit } = this.normalizePagination(paginationQuery);
        const [data, totalItems] = await repository.findAndCount({
            ...options,
            skip: (page - 1) * limit,
            take: limit,
        });

        return this.createResponse(data, page, limit, totalItems);
    }

    public async paginateQueryBuilder<T extends ObjectLiteral>(
        paginationQuery: PaginationQueryDto,
        queryBuilder: SelectQueryBuilder<T>,
    ): Promise<IPaginated<T>> {
        const { page, limit } = this.normalizePagination(paginationQuery);
        const [data, totalItems] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return this.createResponse(data, page, limit, totalItems);
    }

    private normalizePagination(query: PaginationQueryDto) {
        const page = Math.max(1, Math.trunc(query.page ?? 1));
        const limit = Math.min(
            this.maxLimit,
            Math.max(1, Math.trunc(query.limit ?? this.defaultLimit)),
        );

        return { page, limit };
    }

    private createResponse<T>(
        data: T[],
        currentPage: number,
        itemsPerPage: number,
        totalItems: number,
    ): IPaginated<T> {
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
            data,
            meta: {
                itemsPerPage,
                totalItems,
                totalPages,
                currentPage,
                firstPage: totalPages > 0 ? 1 : 0,
                lastPage: totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1 && totalPages > 0,
            },
        };
    }
}
