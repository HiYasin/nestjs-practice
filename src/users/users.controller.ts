import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dtos/create-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

}
