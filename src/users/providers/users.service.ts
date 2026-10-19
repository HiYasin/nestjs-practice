import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GetUsersParamDto } from '../dtos/get-user-param.dto.js';
import { AuthService } from '../../auth/providers/auth.service.js';
import type { WrapperType } from '../../common/types/wrapper.type.js';

/**
 * UsersService is responsible for handling user-related operations and interactions
 */
@Injectable()
export class UsersService {

    // Injecting AuthService to access authentication-related operations within UsersService
    /**
     * Creates an instance of UsersService.
     * @param authService 
     */
    constructor(
        @Inject(forwardRef(() => AuthService))
        // private readonly authService: AuthService
        private readonly authService: WrapperType<AuthService>
    ) { }


    /**
     * Finds all users based on the provided parameters, page number, and limit.
     * @param getUserParamDto The parameters to filter users by.
     * @param page The page number to retrieve.
     * @param limit The number of users to retrieve per page.
     * @returns A list of users that match the provided criteria.
     */
    public findAll(
        getUserParamDto: GetUsersParamDto,
        page: number,
        limit: number
    ) {
        const isAuth = this.authService.isAuth(); // Example usage of AuthService to check authentication status
        console.log('Is Authenticated:', isAuth);
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

    /**
     * Finds a user by their ID.
     * @param id The ID of the user to find.
     * @returns The user with the specified ID.
     */
    public findOne(id: number) {
        return {
            id,
            firstName: 'John',
            email: 'john@example.com'
        };
    }
}
