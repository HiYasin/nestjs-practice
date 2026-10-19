import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { GetUsersParamDto } from './dtos/get-user-param.dto.js';

@Controller('users')
export class UsersController {

  // Injected UsersService instance to handle user-related operations
  constructor(private readonly usersService: UsersService) { }

  @Get()
  public getUsers(
    @Param() getUserParamDto: GetUsersParamDto,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return {
      data: this.usersService.findAll(getUserParamDto, page, limit),
      meta: {
        page,
        limit
      }
    }
  }


  @Post()
  public createUser(@Body() request: any) {
    console.log(request);
    return 'User created successfully.'
  }

  @Patch()
  public patchUser(@Body() request: any) {
    console.log(request);
    return 'User updated successfully.'
  }
}
