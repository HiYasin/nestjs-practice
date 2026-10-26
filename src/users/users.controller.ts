import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { CreateManyUsersDto } from './dtos/create-many-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  public async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('create-many')
  // public async createManyUsers(@Body() createUsersDto: CreateUserDto[]) { // Array of a DTO doesn't provide validation. It gives only type-safety.
  public async createManyUsers(@Body() createManyUsersDto: CreateManyUsersDto) {
    return this.usersService.createManyUsers(createManyUsersDto);
  }

  @Get()
  public async findAll() {
    return this.usersService.findAll();
  }

  @Get('custom-exception')
  public async getCustomException() {
    return this.usersService.customException();
  }

  @Get(':id')
  public async findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }
}
