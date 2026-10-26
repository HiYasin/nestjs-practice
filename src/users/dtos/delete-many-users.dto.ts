import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class DeleteManyUsersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}
