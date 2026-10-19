import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GetUsersParamDto } from '../dtos/get-user-param.dto.js';
import { AuthService } from '../../auth/providers/auth.service.js';

@Injectable()
export class UsersService {

    // Injecting AuthService to access authentication-related operations within UsersService
    constructor(
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService
    ) { }


    public findAll(
        getUserParamDto: GetUsersParamDto,
        page: number,
        limit: number
    ) {
        return [
            {
                firstName: 'John',
                email: 'john@example.com'
            },
            {
                firstName: 'Jane',
                email: 'jane@example.com'
            }
        ]
    }

    public findOne(id: number) {
        return {
            id,
            firstName: 'John',
            email: 'john@example.com'
        };
    }
}
