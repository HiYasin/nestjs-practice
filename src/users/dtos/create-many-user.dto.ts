import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { CreateUserDto } from "./create-user.dto.js";
import { Type } from "class-transformer";

export class CreateManyUsersDto {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateUserDto)
    users: CreateUserDto[];
}