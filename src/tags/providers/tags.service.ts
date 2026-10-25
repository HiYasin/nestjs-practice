import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../tag.entity.js';
import { Repository } from 'typeorm';
import { CreateTagDto } from '../dto/create-tag.dto.js';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private readonly tagRepository: Repository<Tag>
    ) { }

    public async create(createTagDto: CreateTagDto) {
        // Check if tag already exists
        const isTagExists = await this.tagRepository.findOne({ where: { name: createTagDto.name } });
        // Handle the exception when the tag already exists
        if (isTagExists) {
            throw new Error('Tag already exists');
        }

        // Create a new-tag instance
        const newTag = this.tagRepository.create(createTagDto);

        // Save it to the database
        return await this.tagRepository.save(newTag);
    }

    public async findAll(): Promise<Tag[]> {
        return await this.tagRepository.find();
    }

    public async findOneById(id: string): Promise<Tag> {
        const tag = await this.tagRepository.findOneBy({ id });
        if (!tag) {
            throw new NotFoundException(`Tag with id ${id} not found`);
        }
        return tag;
    }

    public async delete(id: string): Promise<void> {
        const result = await this.tagRepository.delete({ id }); // or softDelete
        if (!result.affected) {
            throw new NotFoundException(`Tag with id ${id} not found`);
        }
    }
}
