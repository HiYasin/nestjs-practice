import { IsJSON, IsNotEmpty } from "class-validator";

export class CreateMetaOptionDto {
  @IsNotEmpty()
  @IsJSON()
  metaValue: string;
}
