import { IsInt, IsOptional } from 'class-validator';

import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUsersParamDto {
  @ApiPropertyOptional({
    description: 'Get user by specific id',
    example: "123",
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;
}