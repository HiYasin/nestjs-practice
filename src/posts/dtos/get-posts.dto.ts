import { IntersectionType } from "@nestjs/mapped-types";
import { IsDate, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../common/pagination/dtos/pagination-query.dto.js";

export class GetPostsBaseDto {

    @IsDate()
    @IsOptional()
    startDate?: Date;

    @IsDate()
    @IsOptional()
    endDate?: Date;
}

export class GetPostsDto extends IntersectionType(
    GetPostsBaseDto,
    PaginationQueryDto
) {}