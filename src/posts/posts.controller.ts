import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PostsService } from './providers/posts.service.js';
import { CreatePostDto } from './dtos/create-post.dto.js';

@Controller('posts')
export class PostsController {

  constructor(private readonly postsService: PostsService) { }

  @Post()
  public createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }
}
