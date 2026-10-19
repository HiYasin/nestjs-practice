import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/providers/users.service.js';

@Injectable()
export class PostsService {

    // Injeciting UsersService to access user-related operations within PostsService
    constructor(private readonly usersService: UsersService) { }

    public findAll(userId: number) {
        // Example of using UsersService within PostsService
        const user = this.usersService.findOne(userId);
        return {
            user,
            posts: [
                {
                    title: 'Post 1',
                    content: 'Content of Post 1'
                },
                {
                    title: 'Post 2',
                    content: 'Content of Post 2'
                }
            ]
        }
    }
}
