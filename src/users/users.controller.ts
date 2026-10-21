import { Controller } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

}
