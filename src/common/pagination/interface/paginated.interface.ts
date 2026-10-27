export interface IPaginated<T> {
    data: T[];
    meta: {
        itemsPerPage: number;
        totalItems: number;
        currentPage: number;
        totalPages: number;
        firstPage: number;
        lastPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
