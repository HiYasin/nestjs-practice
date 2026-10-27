import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post.entity.js';
import { Between, Repository } from 'typeorm';
// import { MetaOption } from '../../meta-options/entities/meta-option.entity.js';
import { CreatePostDto } from '../dtos/create-post.dto.js';
import { UsersService } from '../../users/providers/users.service.js';
import { TagsService } from '../../tags/providers/tags.service.js';
import { PatchPostDto } from '../dtos/patch-post.dto.js';

@Injectable()
export class PostsService {
  constructor(

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    // @InjectRepository(MetaOption)
    // private readonly metaOptionRepository: Repository<MetaOption>

    private readonly usersService: UsersService,
    private readonly tagsService: TagsService
  ) { }


  public async create(createPostDto: CreatePostDto) {

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
    // const post = this.postRepository.create(createPostDto);
    // return await this.postRepository.save(post);


    // Find the author
    const author = await this.usersService.findOneById(createPostDto.authorId);
    if (!author) {
      throw new Error(`Author with id ${createPostDto.authorId} not found`);
    }

    // Find the tags
    const tags = createPostDto.tags?.length ? await this.tagsService.findMultipleByIds(createPostDto.tags) : [];
    
    const post = this.postRepository.create({
        ...createPostDto,
        author,
        tags
      });
    return await this.postRepository.save(post);
  }

  public async findAll(): Promise<Post[]> {

    // Without eager: true, in entity relation, we would have to specify relations here to populate the metaOptions for each post.
    // return await this.postRepository.find({
    //   relations: {
    //     metaOptions: true, // This will fetch the related metaOptions for each post
    //     tags: true, // This will fetch the related tags for each post
    //     author: true, // This will fetch the related author for each post
    //   }
    // });

    // With eager: true, in entity relation, we don't need to specify relations here.
    return await this.postRepository.find();
  }

  async delete(id: string) {

    // Option 01
    // Even cascade true is set in the OneToOne relationship, we have to delete the metaOptions separately before deleting the post.
    // Without cascade: true, we would have to delete the metaOptions separately before deleting the post.
    // const post = await this.postRepository.findOneBy({ id });
    // if (!post) {
    //   throw new Error(`Post with id ${id} not found`);
    // }
    // await this.metaOptionRepository.delete({ post: { id } });
    // await this.postRepository.delete(id);

    // Option 02
    // With remove method of the repository, we can delete the post and its related metaOptions in one go, if cascade: true is set in the OneToOne relationship.
    // In this case the metaOptions must be populated for the post, otherwise it will not be deleted.
    // const post = await this.postRepository.findOne({ where: { id }, relations: { metaOptions: true } });
    // if (!post) {
    //   throw new Error(`Post with id ${id} not found`);
    // }
    // await this.postRepository.remove(post);


    // Option 03
    // With cascade: true and onDelete: 'CASCADE' set in the OneToOne bidirectional relationship, we can delete the post and its related metaOptions in one go, without having to populate the metaOptions for the post.
    return await this.postRepository.delete(id);
  }


  public async update(patchPostDto: PatchPostDto){
    // Find the post
    const post = await this.postRepository.findOneBy({ id: patchPostDto.id });
    if (!post) {
      throw new Error(`Post with id ${patchPostDto.id} not found`);
    }

    const { tags, authorId, ...updateData } = patchPostDto;

    // Find the tags
    post.tags = await this.tagsService.findMultipleByIds(patchPostDto.tags || []);

    // Update the post
    const updatedPost = this.postRepository.merge(post, updateData);

    // Save the updated post
    return await this.postRepository.save(updatedPost);
  }

  public async findAllByUser(postQuery: any, userId: string) {
    const { limit, page, startDate, endDate } = postQuery;
    const skip = (page - 1) * limit;
    const posts = await this.postRepository.find({
      where: { 
        author: { id: userId },
        publishOn: startDate && endDate ? Between(new Date(startDate), new Date(endDate)) : undefined
      },
      skip,
      take: limit,
    });

    return {
      posts,
      meta: {
        page,
        limit,
        total: posts.length
      }
    }
  }
}