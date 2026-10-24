import { Injectable } from '@nestjs/common';
import { UpdateMetaOptionDto } from './dto/update-meta-option.dto.js';
import { Repository } from 'typeorm';
import { MetaOption } from './entities/meta-option.entity.js';
import { CreatePostMetaOptionDto } from './dto/create-post-meta-options.dto.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MetaOptionsService {

  constructor(
    @InjectRepository(MetaOption)
    private readonly metaOptionsRepository: Repository<MetaOption>
  ){}
  
  async create(createPostMetaOptionDto: CreatePostMetaOptionDto) {
    const metaOption = this.metaOptionsRepository.create(createPostMetaOptionDto);
    return await this.metaOptionsRepository.save(metaOption);
  }

  findAll() {
    return `This action returns all metaOptions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} metaOption`;
  }

  update(id: number, updateMetaOptionDto: UpdateMetaOptionDto) {
    return `This action updates a #${id} metaOption`;
  }

  remove(id: number) {
    return `This action removes a #${id} metaOption`;
  }
}
