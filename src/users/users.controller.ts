import { Body, Controller, Get, Headers, Ip, Param, Post, Query, Req } from '@nestjs/common';
import { type Request } from 'express';

@Controller('users')
export class UsersController {
  // Define and access query param
  @Get()
  public getUsers(@Query() query: any) {
    console.log(query);
    return 'Users retrive successfully.'
  }

  // Access body
  @Post()
  public createUser(@Body() request: any) {
    console.log(request);
    return 'User created successfully.'
  }

  // Define & access param
  @Get('/:id')
  public getUser(@Param() params: string) {
    console.log(params);
    return 'User retrived successfully'
  }

  // Access underlying express request directly
  @Post('/profile')
  public createUserProfile(@Req() request: Request) {
    // console.log(request);
    console.log(request.body);
    return 'User profile created successfully.'
  }

  // Define & access optional param
  @Get('/profile/{:id}/')
  public getUserProfile(@Param() param: any) {
    console.log(param);
    return 'User profile retrived successfully.'
  }

  // Grab specific param
  @Get('/profile/:id/:name')
  public getUserProfileParam(@Param() param: any) {
    console.log(param.name);
    return 'User profile retrived successfully.'
  }

  // Access headers and IP
  @Post('/info')
  public getUserInfo(@Body() body:any, @Headers() headers: any, @Ip() ip: any) {
    console.log(body)
    console.log(headers);
    console.log(ip);
    return 'User info retrived successfully.'
  }

}
