// import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class PaginationQueryDto {
    @IsOptional()
    @IsPositive()
    // @Type(()=> Number) // Using enableImplicitConversion we don't need to use Type conversion explicitly in each DTO.
    limit?: number=10;

    @IsOptional()
    @IsPositive()
    // @Type(()=> Number) // Using enableImplicitConversion we don't need to use Type conversion explicitly in each DTO.
    page?: number=1;
}