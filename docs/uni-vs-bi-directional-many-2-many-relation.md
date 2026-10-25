A simple example of a many-to-many relationship is between a `Post` and a `Tag`. A post can have multiple tags (e.g. `nestjs`, `typescript`, `backend`), and a single tag can be assigned to many different posts.

In relational databases (such as PostgreSQL), a many-to-many relationship cannot be represented with a simple foreign key on either table. Instead, it requires an intermediary table known as a **join table** (or **junction table**), typically named `post_tags_tag` or `posts_tags`. This table contains composite foreign keys referencing both tables:

- `postId` referencing `post(id)`
- `tagId` referencing `tag(id)`

---

## 1. Uni-directional Many-to-Many

Only one entity knows about the relationship.

In TypeORM, you place `@ManyToMany` together with `@JoinTable()` on the entity that needs to navigate the relationship (the owning side). The target entity has no property referencing back.

```ts
// src/posts/post.entity.ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];
}

// src/tags/tag.entity.ts
@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  // No reference to Post
}
```

### Characteristics:
- **Navigation**: You can navigate `post.tags`, but `tag.posts` does not exist.
- **Database Schema**: A join table (`post_tags_tag`) is still generated with `postId` and `tagId` foreign keys.
- **Owning Side**: `Post` is the owning side because it declares `@JoinTable()`.

---

## 2. Bi-directional Many-to-Many

Both entities know about each other and can navigate the relationship in code.

```ts
// src/posts/post.entity.ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable()
  tags: Tag[];
}

// src/tags/tag.entity.ts
@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
```

### Characteristics:
- **Navigation**: Both ways. From `Post`, you can access `post.tags`. From `Tag`, you can access `tag.posts`.
- **Owning vs Inverse Side**:
  - **Owning side (`Post`)**: The entity that specifies `@JoinTable()`. Only **one** side may declare `@JoinTable()`.
  - **Inverse side (`Tag`)**: Declares `@ManyToMany` with an inverse property selector (`(post) => post.tags`), but **no** `@JoinTable()`.
- **Database Schema**: Generates the exact same join table as the uni-directional relationship.

---

## Relationship in this Project

The actual implementation in this project:

```ts
// src/posts/post.entity.ts
@ManyToMany(() => Tag, (tag) => tag.posts, { eager: true })
@JoinTable()
tags?: Tag[];
```

```ts
// src/tags/tag.entity.ts
@ManyToMany(() => Post, (post) => post.tags, {
  onDelete: 'CASCADE',
})
posts?: Post[];
```

### How Posts and Tags are linked in `PostsService`:

When creating or updating a post, tags are looked up by their IDs and assigned directly:

```ts
// src/posts/providers/posts.service.ts
const tags = createPostDto.tags?.length
  ? await this.tagsService.findMultipleByIds(createPostDto.tags)
  : [];

const post = this.postRepository.create({
  ...createPostDto,
  author,
  tags,
});

return await this.postRepository.save(post);
```

When `postRepository.save(post)` executes:
1. The `post` row is inserted or updated in the `post` table.
2. TypeORM inserts corresponding association pairs `(postId, tagId)` into the `post_tags_tag` join table.

---

## The Tag Removal Problem: Foreign Key Constraint Violation

### The Scenario
Suppose Post `P1` is associated with Tag `T1`. In the database, the join table holds:

| postId | tagId |
| :--- | :--- |
| `P1` | `T1` |

Now an admin sends a request to delete Tag `T1` via `DELETE /tags/:id`:

```ts
// src/tags/providers/tags.service.ts
public async delete(id: string) {
  const result = await this.tagRepository.delete({ id });
  if (!result.affected) {
    throw new NotFoundException(`Tag with id ${id} not found`);
  }
  return result;
}
```

### Why a Foreign Key (FK) Constraint Violation Happens

1. `tagRepository.delete({ id })` executes a direct SQL `DELETE` statement:
   ```sql
   DELETE FROM "tag" WHERE "id" = $1;
   ```
2. The `Tag` entity is the **inverse side** of the relationship (it does not own `@JoinTable()`). TypeORM's `tagRepository.delete()` does **not** automatically execute queries against the `post_tags_tag` join table.
3. In PostgreSQL, the join table has a foreign key constraint pointing to `tag(id)`:
   ```sql
   CONSTRAINT "FK_post_tags_tag_tagId" FOREIGN KEY ("tagId") REFERENCES "tag"("id")
   ```
4. By default, PostgreSQL enforces foreign key constraints with `ON DELETE NO ACTION` (or `RESTRICT`).
5. Because row `(P1, T1)` still exists in `post_tags_tag`, PostgreSQL blocks the deletion and throws an error:

```text
QueryFailedError: update or delete on table "tag" violates foreign key constraint "FK_..._tagId" on table "post_tags_tag"
DETAIL: Key (id)=(...) is still referenced from table "post_tags_tag".
```

The request fails with a `500 Internal Server Error`.

---

## How `onDelete: 'CASCADE'` Solves the Problem

To allow a tag to be removed without FK violations—and without making `Tag` the owning side—we specify `onDelete: 'CASCADE'` in the `@ManyToMany` decorator:

```ts
// src/tags/tag.entity.ts
@ManyToMany(() => Post, (post) => post.tags, {
  onDelete: 'CASCADE',
})
posts?: Post[];
```

### What happens under the hood:

1. **Database-level Constraint**: When TypeORM creates or synchronizes the schema, it tells PostgreSQL to add `ON DELETE CASCADE` to the join table's foreign key constraint referencing `tag(id)`:
   ```sql
   ALTER TABLE "post_tags_tag"
   ADD CONSTRAINT "FK_post_tags_tag_tagId"
   FOREIGN KEY ("tagId") REFERENCES "tag"("id")
   ON DELETE CASCADE;
   ```
2. **Execution Flow on Delete**:
   When `this.tagRepository.delete({ id })` runs:
   ```sql
   DELETE FROM "tag" WHERE "id" = $1;
   ```
3. **Automatic Cleanup by PostgreSQL**:
   - PostgreSQL's query engine intercepts the deletion of the `tag` row.
   - It automatically removes all rows in `post_tags_tag` where `tagId = $1`.
   - The deletion of `tag` succeeds cleanly.
   - **The posts themselves are preserved**; only the relationship link in `post_tags_tag` is removed.

---

## Database `onDelete: 'CASCADE'` vs Application `cascade: true`

A common source of confusion in TypeORM is the difference between `onDelete: 'CASCADE'` and `cascade: true`:

| Feature | `onDelete: 'CASCADE'` | `cascade: true` |
| :--- | :--- | :--- |
| **Level** | **Database level** (PostgreSQL foreign key rule) | **ORM / Application level** (TypeScript / TypeORM runtime) |
| **How it works** | Enforced by PostgreSQL engine via `ON DELETE CASCADE` constraint. | Handled in JavaScript memory by TypeORM before issuing queries. |
| **Triggered by** | Any SQL delete, including `repository.delete(id)`, raw SQL queries, or pgAdmin. | Only `repository.save()` or `repository.remove()` on loaded entity instances. |
| **`repository.delete()`** | **Works**. Cleans up join table rows automatically. | **Ignored**. `delete()` runs raw SQL and bypasses entity cascades. |
| **Performance** | **Very high**. Single DB operation; no in-memory entity graph loading. | Lower. Requires loading parent and child entities into memory. |

> [!IMPORTANT]
> `cascade: ['remove']` on the inverse side (`Tag`) would not remove join table rows when using `tagRepository.delete({ id })`. Only database-level `onDelete: 'CASCADE'` handles direct repository deletes cleanly.

---

## Uni-directional Alternative: Configuring `@JoinTable()` on Post

If you wanted to keep the relationship strictly **uni-directional** (so `Tag` has no `posts` property at all), you can still enable database cascade when a tag is deleted by configuring `inverseJoinColumn` on `Post`:

```ts
// src/posts/post.entity.ts (Uni-directional with DB cascade)
@ManyToMany(() => Tag, { eager: true })
@JoinTable({
  name: 'post_tags_tag',
  joinColumn: {
    name: 'postId',
    referencedColumnName: 'id',
  },
  inverseJoinColumn: {
    name: 'tagId',
    referencedColumnName: 'id',
    onDelete: 'CASCADE', // Cleans up join table when tag is deleted
  },
})
tags?: Tag[];
```

This achieves the same database constraint (`ON DELETE CASCADE` on `tagId`) without adding a `posts` field to `Tag`.

---

## Soft Delete vs Hard Delete

Notice that `Tag` in this project also includes `@DeleteDateColumn`:

```ts
// src/tags/tag.entity.ts
@DeleteDateColumn()
deleteDate: Date;
```

- **`tagRepository.softDelete(id)`**: Updates `deleteDate` to `NOW()`. Because no SQL `DELETE` is executed, no foreign key constraint is checked. The join table row remains intact in the database. When fetching posts with `tags`, soft-deleted tags must be filtered out if desired.
- **`tagRepository.delete(id)`**: Executes a hard SQL `DELETE`. This is where `onDelete: 'CASCADE'` is strictly required to prevent foreign key constraint violation.

---

## Key Differences Summary

| Feature | Uni-directional Many-to-Many | Bi-directional Many-to-Many |
| :--- | :--- | :--- |
| **Navigation** | `Post → Tag` only | `Post → Tag` and `Tag → Post` |
| **Decorators on `Post`** | `@ManyToMany(() => Tag)` + `@JoinTable()` | `@ManyToMany(() => Tag, tag => tag.posts)` + `@JoinTable()` |
| **Decorators on `Tag`** | None | `@ManyToMany(() => Post, post => post.tags)` |
| **Join Table** | `post_tags_tag` | `post_tags_tag` (identical) |
| **Owning Side** | `Post` | `Post` (the side with `@JoinTable()`) |
| **Inverse Side** | None | `Tag` |
| **Tag Deletion with `onDelete: 'CASCADE'`** | Configured on `@JoinTable.inverseJoinColumn` | Configured on `Tag.@ManyToMany` |

---

## Common Pitfalls & Best Practices

### 1. Never put `@JoinTable()` on both entities
`@JoinTable()` must only be specified on **one** side of the relationship. Putting it on both creates two separate join tables (`post_tags_tag` and `tag_posts_post`), breaking relationship synchronization.

### 2. Circular dependency with ESM
When `Post` imports `Tag` and `Tag` imports `Post`, JavaScript modules can encounter circular dependencies during initialization. Use `Relation<T>` or keep property types as arrays (`Post[]` / `Tag[]`). TypeScript compiles array types as `Array` metadata, which avoids eager module evaluation crashes.

### 3. Caution with `eager: true`
In `post.entity.ts`, `tags` has `eager: true`. While convenient for basic queries, every query on `Post` will perform a `LEFT JOIN` on `post_tags_tag` and `tag`. In larger production systems, prefer explicit query joins using `relations: { tags: true }` or QueryBuilder for better control over query performance.
