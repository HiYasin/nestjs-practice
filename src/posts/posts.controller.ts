import { Controller, Get, Param } from '@nestjs/common';
import { PostsService } from './providers/posts.service.js';

@Controller('posts')
export class PostsController {

    // Injecting postservice
    constructor(private readonly postsService: PostsService) { }

    @Get('/:userId')
    public getUserPosts(@Param('userId') userId: number) {
        return this.postsService.findAll(userId);
    }
}
