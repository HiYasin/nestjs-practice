A simple example of a one-to-one relationship is between a `User` and a `Profile`. Each user has one profile, and each profile belongs to one user.

## 1. Uni-directional One-to-One

Only one entity knows about the relationship.

Example: `User` knows about `Profile`, but `Profile` doesn't have a reference to `User`.

```

class User {
  id: number;
  name: string;
  profile: Profile;
}

class Profile {
  id: number;
  bio: string;
}

```

- From `User`, you can access `user.profile`.
- From `Profile`, you cannot directly access `profile.user`.

User

Profile

One-way navigation

## 2. Bi-directional One-to-One

Both entities know about the relationship.

Example: `User` knows about `Profile`, and `Profile` also knows about `User`.

```

class User {
  id: number;
  name: string;
  profile: Profile;
}

class Profile {
  id: number;
  bio: string;
  user: User;
}

```

- From `User`, you can access `user.profile`.
- From `Profile`, you can access `profile.user`.

User

Profile

Two-way navigation

## Key difference

| Feature        | Uni-directional | Bi-directional        |
| -------------- | --------------- | --------------------- |
| Navigation     | One way         | Both ways             |
| User → Profile | Yes             | Yes                   |
| Profile → User | No              | Yes                   |
| Complexity     | Simpler         | Slightly more complex |

Important: In an ORM such as TypeORM, uni-directional and bi-directional describe how entities navigate the relationship in code. They do not necessarily mean one-way versus two-way data flow in the database. A one-to-one relationship typically uses a foreign key with a `UNIQUE` constraint to enforce the one-to-one rule.

## Issues

### `ReferenceError: Cannot access 'Post' before initialization`

A bi-directional relation creates a circular import between the two entity files:

```text

      ┌──────────import Post───────────┐
      |                                ▼
post.entity.ts                meta-option.entity.ts
      ▲                                │
      └───────import MetaOption────────┘
```

With `"emitDecoratorMetadata": true` (the NestJS default), TypeScript writes the property type into the decorator metadata **eagerly**:

```js
// dist/meta-options/entities/meta-option.entity.js
__decorate([
  OneToOne(() => Post, (post) => post.metaOptions, { ... }), // lazy, safe
  JoinColumn(),
  __metadata("design:type", Post),                           // eager, crashes
], MetaOption.prototype, "post", void 0);
```

The `() => Post` arrow is only called later by TypeORM, but `Post` inside `__metadata(...)` must already exist when the module body executes. Because of the import cycle, `Post` is still in its temporal dead zone at that moment, so loading the module throws.

The other side does not fail because `metaOptions?: MetaOption | null` is a union, and TypeScript emits `Object` for union types instead of a reference to the class:

```js
__metadata("design:type", Object)
```

**Fix** — wrap the property type in TypeORM's `Relation<T>` helper, which keeps full type safety but is emitted as `Object`:

```ts
import type { Relation } from 'typeorm';

@OneToOne(() => Post, (post) => post.metaOptions, {
  onDelete: 'CASCADE',
})
@JoinColumn()
post: Relation<Post>;
```

`Relation<T>` is declared as `type Relation<T> = T`, so it only changes what the compiler writes into the reflection metadata. `Post` must stay a normal value import because `() => Post` needs it at runtime.

Two related things to check:

- Import decorators from `typeorm`, not `typeorm/browser` — the browser entry point is a separate build meant for bundlers.
- Do not switch `Post` to `import type`, or the lazy `() => Post` will resolve to `undefined` when TypeORM builds the relation.

**Alternative:** `post?: Post | null` also avoids the error (unions emit `Object`), but `Relation<Post>` is the documented solution and states the intent explicitly. Disabling `emitDecoratorMetadata` globally is not recommended.