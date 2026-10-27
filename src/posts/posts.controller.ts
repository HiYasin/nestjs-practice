import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PostsService } from './providers/posts.service.js';
import { CreatePostDto } from './dtos/create-post.dto.js';
import { PatchPostDto } from './dtos/patch-post.dto.js';
import { GetPostsDto } from './dtos/get-posts.dto.js';

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

  @Get('/:userId')
  public getPosts(
    @Param('userId') userId: string,
    @Query() postQuery: GetPostsDto,
  ) {
    return this.postsService.findAllByUser(postQuery, userId);
  }
}
