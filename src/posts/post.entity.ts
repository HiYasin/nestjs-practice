import { Column, Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { postType } from './enums/postType.enum.js';
import { postStatus } from './enums/postStatus.enum.js';
import { MetaOption } from '../meta-options/entities/meta-option.entity.js';

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

  // Work on these in lecture on relationships
  tags?: string[];

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
}