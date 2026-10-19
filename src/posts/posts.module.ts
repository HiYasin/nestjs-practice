import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsService } from './providers/posts.service.js';

@Module({
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
