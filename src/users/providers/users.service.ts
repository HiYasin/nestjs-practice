import { Injectable } from '@nestjs/common';
import { GetUsersParamDto } from '../dtos/get-user-param.dto.js';

@Injectable()
export class UsersService {
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
