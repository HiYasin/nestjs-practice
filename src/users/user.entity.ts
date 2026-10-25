import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./dtos/create-user.dto.js";
import { Post } from "../posts/post.entity.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 96,
        nullable: false
    })
    firstName: string;

    @Column({
        type: 'varchar',
        length: 96,
        nullable: false
    })
    lastName: string;

    @Column({
        type: 'varchar',
        nullable: false,
        unique: true
    })
    email: string;

    @Column({
        type: 'varchar',
        nullable: false
    })
    password: string;

    @Column({
        type: 'enum',
        enum: Role,
        nullable: false,
        default: Role.USER
    })
    role: Role;

    @OneToMany(()=> Post, post => post.author)
    posts: Post[];
}