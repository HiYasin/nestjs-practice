import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Post } from "../../posts/post.entity.js";

@Entity()
export class MetaOption {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'json',
    nullable: false
  })
  metaValue: string

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  // Bidirectional OneToOne relationship with Post entity
  @OneToOne(()=> Post, post => post.metaOptions, {
    onDelete: 'CASCADE', // This ensures that when a Post is deleted, the associated MetaOption is also deleted.
  })
  @JoinColumn() // This decorator is used to specify that this side of the relationship owns the foreign key.
  post: Relation<Post>;
}
