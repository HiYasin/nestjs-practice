import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsService } from './providers/posts.service.js';
import { UsersModule } from '../users/users.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity.js';
import { MetaOption } from '../meta-options/entities/meta-option.entity.js';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [UsersModule, TypeOrmModule.forFeature([Post, MetaOption])] // Only imports the exported providers from UsersModule, not all entities and controllers of UsersModule
})
export class PostsModule {}
