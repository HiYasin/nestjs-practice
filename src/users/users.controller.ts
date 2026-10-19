import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { GetUsersParamDto } from './dtos/get-user-param.dto.js';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users Endpoint') // If not provided, the default tag will be the controller name
export class UsersController {

  // Injected UsersService instance to handle user-related operations
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({
    summary: 'Get users with optional filtering and pagination',
    description: 'This endpoint allows you to retrieve users with optional filtering and pagination options.'
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of users to retrieve per page',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved users',
  })
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
