import { IsJSON, IsNotEmpty } from "class-validator";

export class CreatePostMetaOptionDto {
  @IsNotEmpty()
  @IsJSON()
  metaValue: string;
}