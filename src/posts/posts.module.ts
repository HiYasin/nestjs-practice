import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsService } from './providers/posts.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [UsersModule] // Only imports the exported providers from UsersModule, not all entities and controllers of UsersModule
})
export class PostsModule {}
