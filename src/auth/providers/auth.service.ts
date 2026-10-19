import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/providers/users.service.js';

@Injectable()
export class AuthService {

    // Injecting UsersService to access user-related operations within AuthService
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService
    ) { }
}
