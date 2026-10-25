import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller.js';
import { TagsService } from './providers/tags.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './tag.entity.js';

@Module({
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
  imports: [TypeOrmModule.forFeature([Tag])]
})
export class TagsModule {}
