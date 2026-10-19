// import { PartialType } from '@nestjs/mapped-types';
// nextjs/mapped-types doesn't generate swagger api documentation, so we use @nestjs/swagger instead
// This is because @nestjs/swagger extends the functionality of @nestjs/mapped-types to include swagger decorators

import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

export class PatchUserDto extends PartialType(CreateUserDto) {}