import { PartialType } from '@nestjs/swagger';
import { CreateMetaOptionDto } from './create-meta-option.dto.js';

export class UpdateMetaOptionDto extends PartialType(CreateMetaOptionDto) {}
