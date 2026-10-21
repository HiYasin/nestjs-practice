import { Controller } from '@nestjs/common';
import { PostsService } from './providers/posts.service.js';

@Controller('posts')
export class PostsController {

    constructor(private readonly postsService: PostsService) { }
}
