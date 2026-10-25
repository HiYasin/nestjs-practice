import { Column, Entity, PrimaryGeneratedColumn, OneToOne, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import type { Relation } from 'typeorm';
import { postType } from './enums/postType.enum.js';
import { postStatus } from './enums/postStatus.enum.js';
import { MetaOption } from '../meta-options/entities/meta-option.entity.js';
import { User } from '../users/user.entity.js';
import { Tag } from '../tags/tag.entity.js';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 512,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'enum',
    enum: postType,
    nullable: false,
    default: postType.POST,
  })
  postType: postType;

  @Column({
    type: 'varchar',
    length: 256,
    nullable: false,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'enum',
    enum: postStatus,
    nullable: false,
    default: postStatus.DRAFT,
  })
  status: postStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  content?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  schema?: string;

  @Column({
    type: 'varchar',
    length: 1024,
    nullable: true,
  })
  featuredImageUrl?: string;

  @Column({
    type: 'timestamp', // 'datetime' in mysql
    nullable: true,
  })
  publishOn?: Date;


  // Unidirectional OneToOne relationship with MetaOption entity
  // @OneToOne(() => MetaOption, {
  //   cascade: true,
  //   eager: true,
  // })
  // @JoinColumn()

  // Bidirectional OneToOne relationship with MetaOption entity
  @OneToOne(() => MetaOption, metaOption => metaOption.post, {
    cascade: true,
    eager: true,
  })
  metaOptions?: MetaOption | null;

  @ManyToOne(() => User, user => user.posts,{
    eager: true,
  })
  author: Relation<User>;

  @ManyToMany(() => Tag, tag=> tag.posts, { eager: true})
  @JoinTable()
  tags?: Tag[];

}