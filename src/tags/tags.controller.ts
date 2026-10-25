import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { TagsService } from './providers/tags.service.js';

@Controller('tags')
export class TagsController {
    constructor(
        private readonly tagsService: TagsService
    ) { }

    @Post()
    async createTag(@Body() createTagDto: CreateTagDto) {
        return await this.tagsService.create(createTagDto);
    }

    @Get()
    async getAllTags() {
        return await this.tagsService.findAll();
    }

    @Get(':id')
    async getTagById(@Param('id') id: string) {
        return await this.tagsService.findOneById(id);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return await this.tagsService.delete(id);
    }

    @Delete('soft/:id')
    async softDelete(@Param('id') id: string) {
        return await this.tagsService.softDelete(id);
    }
}
