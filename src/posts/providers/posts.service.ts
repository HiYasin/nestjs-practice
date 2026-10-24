import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post.entity.js';
import { Repository } from 'typeorm';
// import { MetaOption } from '../../meta-options/entities/meta-option.entity.js';
import { CreatePostDto } from '../dtos/create-post.dto.js';

@Injectable()
export class PostsService {
  constructor(

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    // @InjectRepository(MetaOption)
    // private readonly metaOptionRepository: Repository<MetaOption>
  ) {}


  public async create(createPostDto: CreatePostDto){
    
    // Without adding cascade: true in the OneToOne relationship, we would have to create and save the metaOptions separately.
    // const metaOptions = createPostDto.metaOptions ? this.metaOptionRepository.create(createPostDto.metaOptions) : undefined;
    // if(metaOptions){
    //   await this.metaOptionRepository.save(metaOptions);
    // }

    // const post = this.postRepository.create({
    //   ...createPostDto,
    //   metaOptions: metaOptions
    // });


    // With cascade: true, we can create and save the metaOptions in one go.
    const post = this.postRepository.create(createPostDto);
    return await this.postRepository.save(post);
  }
}