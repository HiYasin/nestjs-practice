import { IsNotEmpty, IsString } from 'class-validator';
import { CreatePostDto } from './create-post.dto.js';
import { PartialType } from '@nestjs/mapped-types';

export class PatchPostDto extends PartialType(CreatePostDto) {

  @IsString()
  @IsNotEmpty()
  id: string;
}
