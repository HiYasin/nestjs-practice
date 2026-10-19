import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/providers/users.service.js';
import type { WrapperType } from '../../common/types/wrapper.type.js';

@Injectable()
export class AuthService {

    // Injecting UsersService to access user-related operations within AuthService
    constructor(
        @Inject(forwardRef(() => UsersService))
        // private readonly usersService: UsersService
        private readonly usersService: WrapperType<UsersService>
    ) { }

    
    public login(email: string, password: string): string {
        const user = this.usersService.findOne(123); // Example usage of UsersService to find a user by ID
        console.log('User found:', user);
        return 'Session_token';
    }

    public isAuth(): boolean {
        return true;
    }
}
