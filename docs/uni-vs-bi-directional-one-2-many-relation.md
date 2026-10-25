A simple example of a one-to-many relationship is between a `User` and a `Post`. A user can write many posts, but each post has exactly one author.

## 1. Uni-directional One-to-Many

Only one entity knows about the relationship.

In TypeORM this is normally modeled with a `@ManyToOne` on the "many" side only. `Post` knows about `User`, but `User` has no `posts` array.

```ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 512, nullable: false })
  title: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;
}
```

- From `Post`, you can access `post.author`.
- From `User`, you cannot access `user.posts`.
- The foreign key `authorId` lives on the `post` table.

TypeORM cannot build a `@OneToMany` without a matching `@ManyToOne`; the `@ManyToOne` side is what defines the foreign key. So "uni-directional one-to-many" in TypeORM means "define only the `@ManyToOne` side".

## 2. Bi-directional One-to-Many

Both entities know about the relationship. The `@ManyToOne` side owns the foreign key, and `@OneToMany` is the inverse side.

```ts
class User {
  id: string;
  firstName: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}

class Post {
  id: string;
  title: string;

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;
}
```

- From `User`, you can access `user.posts`.
- From `Post`, you can access `post.author`.

Who owns what:

- `@ManyToOne` + `@JoinColumn` → owning side, holds `authorId`.
- `@OneToMany` → inverse side, a virtual property with no column of its own.
- There is no join table (that is `@ManyToMany`).

## Relationship in this project

The current entities in this project:

```ts
// src/users/user.entity.ts
@OneToMany(() => Post, (post) => post.author)
posts: Post[];
```

```ts
// src/posts/post.entity.ts
@ManyToOne(() => User, (user) => user.posts, {
  eager: true,
})
author: Relation<User>;
```

- `eager: true` means `postRepository.find()` automatically joins and returns the author; no `relations: { author: true }` is needed.
- `Relation<User>` exists because the two entity files import each other. It keeps the same type but stops TypeScript from writing an eager `__metadata("design:type", User)` (see the one-to-one document for the full explanation). `posts: Post[]` is safe because array types are emitted as `Array`, not as a reference to `Post`.
- `authorId` on `CreatePostDto` is not a column on the entity. `PostsService.create()` resolves the user and assigns the whole relation:

```ts
const author = await this.usersService.findOneById(createPostDto.authorId);
if (!author) {
  throw new Error(`Author with id ${createPostDto.authorId} not found`);
}

const post = this.postRepository.create({
  ...createPostDto,
  author,
});

return await this.postRepository.save(post);
```

## Key difference

| Feature            | Uni-directional       | Bi-directional              |
| ------------------ | --------------------- | --------------------------- |
| Navigation         | Post → User           | Both ways                   |
| Post → User        | Yes                   | Yes                         |
| User → Post        | No                    | Yes                         |
| TypeORM decorators | `@ManyToOne` only     | `@OneToMany` + `@ManyToOne` |
| Foreign key        | `post.authorId`       | `post.authorId`             |
| Join table         | No                    | No                          |
| Complexity         | Simpler               | Slightly more complex       |

Important: In an ORM such as TypeORM, uni-directional and bi-directional describe how entities navigate the relationship in code. They do not change the database schema. Both variants produce the same `authorId` foreign key on the `post` table. Unlike one-to-one, that column has no `UNIQUE` constraint, because one user may own many posts.

## Issues

### `ReferenceError: Cannot access 'User' before initialization`

`User` imports `Post` and `Post` imports `User`, which creates an ESM circular dependency. With `"emitDecoratorMetadata": true`, a plain property declaration is compiled into an eager reference:

```js
// dist/posts/post.entity.js
__decorate([
  ManyToOne(() => User, (user) => user.posts, { eager: true }), // lazy, safe
  JoinColumn({ name: 'authorId' }),
  __metadata("design:type", User),                               // eager, crashes
], Post.prototype, "author", void 0);
```

`() => User` is only evaluated later by TypeORM, but `User` inside `__metadata(...)` must already exist when the module body runs. In the cycle it is still in its temporal dead zone, so loading the module throws.

**Fix** — use TypeORM's `Relation<T>` helper:

```ts
import type { Relation } from 'typeorm';

@ManyToOne(() => User, (user) => user.posts, { eager: true })
@JoinColumn({ name: 'authorId' })
author: Relation<User>;
```

`Relation<T>` is declared as `type Relation<T> = T`, so the type is unchanged but the compiler emits `Object` instead of a reference to `User`.

The `User` side is safe as written: `posts: Post[]` emits `__metadata("design:type", Array)`, so it never touches `Post` during module evaluation.

### `@OneToMany` without `@ManyToOne` fails

A `@OneToMany` alone cannot define the relationship. TypeORM needs the owning `@ManyToOne` side to know which column holds the foreign key. If you only need `post.author`, keep just the `@ManyToOne` (uni-directional). If you need `user.posts`, you must add `@ManyToOne` on `Post`.

### `authorId` is not an entity property

`CreatePostDto.authorId` only exists in the DTO. Spreading the DTO into `repository.create()` does not populate the relation:

```ts
// does not work as intended
this.postRepository.create({ ...createPostDto });
```

Assign the relation instead, either with a resolved entity (`author`) or with a reference (`author: { id: authorId }`).

### Deleting a user who has posts

The foreign key is declared without `onDelete`, so Postgres defaults to `NO ACTION`. Deleting a `User` that still has posts throws a foreign-key violation (a `500` response). Decide the behaviour explicitly:

```ts
@ManyToOne(() => User, (user) => user.posts, {
  eager: true,
  onDelete: 'CASCADE', // or 'SET NULL' with a nullable authorId
})
```

`CASCADE` deletes the posts with the user; `SET NULL` keeps the posts but removes the author. Blocking the delete in `UsersService` with a clear `ConflictException` is another option.

### `eager: true` has a cost

Every `find()` on `Post` joins the `user` table. That is convenient while learning, but in production it adds work to every query and interacts badly with pagination. Prefer explicit `relations: { author: true }` per query, or `lazy: true`, once the project grows.
