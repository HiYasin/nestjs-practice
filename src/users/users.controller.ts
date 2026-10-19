import { Body, Controller, Get, Headers, Ip, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { type Request } from 'express';

@Controller('users')
export class UsersController {

  @Get()
  public getUsers(@Query() query: any) {
    console.log(query);
    return 'Users retrive successfully.'
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
