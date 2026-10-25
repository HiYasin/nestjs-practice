import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { CreateUserDto } from './dtos/create-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  public async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  public async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  public async findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }
}
