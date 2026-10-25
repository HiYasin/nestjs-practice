import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches, MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

import { Type } from 'class-transformer';
import { postStatus } from '../enums/postStatus.enum.js';
import { postType } from '../enums/postType.enum.js';
import { CreatePostMetaOptionDto } from '../../meta-options/dto/create-post-meta-options.dto.js';

export class CreatePostDto {
  
  @IsString()
  @MinLength(4)
  @MaxLength(512)
  @IsNotEmpty()
  title: string;

  @IsEnum(postType)
  @IsNotEmpty()
  postType: postType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @MinLength(4)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'A slug should be all small letters and uses only "-" and without spaces. For example "my-url"',
  })
  slug: string;

  @IsEnum(postStatus)
  @IsNotEmpty()
  status: postStatus;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsJSON()
  schema?: string;

  @IsOptional()
  @MinLength(4)
  @MaxLength(1024)
  @IsUrl()
  featuredImageUrl?: string;

  @IsISO8601()
  @IsOptional()
  publishOn?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(3, { each: true })
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePostMetaOptionDto)
  metaOptions?: CreatePostMetaOptionDto | null;

  @IsNotEmpty()
  @IsString()
  authorId: string;
}