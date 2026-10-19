import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { GetUsersParamDto } from './dtos/get-user-param.dto.js';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { PatchUserDto } from './dtos/patch-user.dto.js';

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

  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user by ID',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 123 },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
      },
    }
  })
  @Post()
  public createUser(@Body() createUserDto: CreateUserDto) {
    console.log(createUserDto);
    return 'User created successfully.'
  }


  @ApiOperation({
    summary: 'Update user information',
    description: 'This endpoint allows you to update user information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated user information',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User updated successfully.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Bad Request' },
        message: { type: 'string', example: 'Invalid input data' },
      },
    },
  })
  @Patch()
  public patchUser(@Body() patchUserDto: PatchUserDto) {
    console.log(patchUserDto);
    return 'User updated successfully.'
  }
}
