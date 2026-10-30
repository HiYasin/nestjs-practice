import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { CreateManyUsersDto } from './dtos/create-many-user.dto.js';
import { DeleteManyUsersDto } from './dtos/delete-many-users.dto.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';

@Controller('users')
// @UseGuards(AccessTokenGuard) // Apply the guard to all routes in this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  public async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('create-many')
  @UseGuards(AccessTokenGuard)
  // public async createManyUsers(@Body() createUsersDto: CreateUserDto[]) { // Array of a DTO doesn't provide validation. It gives only type-safety.
  public async createManyUsers(@Body() createManyUsersDto: CreateManyUsersDto) {
    return this.usersService.createManyUsers(createManyUsersDto);
  }

  @Delete()
  public async deleteManyUsers(@Body() deleteManyUsersDto: DeleteManyUsersDto) {
    return this.usersService.deleteManyUsers(deleteManyUsersDto.ids);
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
