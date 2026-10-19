import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GetTaskParamDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;

  // @IsOptional()
  // @IsString()
  // name?: string;
}
