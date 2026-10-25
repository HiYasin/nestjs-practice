import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
import { PostsService } from './providers/posts.service.js';
import { CreatePostDto } from './dtos/create-post.dto.js';
import { PatchPostDto } from './dtos/patch-post.dto.js';

@Controller('posts')
export class PostsController {

  constructor(private readonly postsService: PostsService) { }

  @Post()
  public createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  public findAllPosts() {
    return this.postsService.findAll();
  }

  @Delete()
  public deletePost(@Query('id') id: string) {
    return this.postsService.delete(id);
  }

  @Patch()
  public patchPost(@Body() patchPostDto: PatchPostDto) {
    return this.postsService.update(patchPostDto);
  }
}
