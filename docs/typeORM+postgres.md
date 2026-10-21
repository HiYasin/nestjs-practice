# TypeORM + PostgreSQL in NestJS

From zero to `entity → repository → service → controller`.

## 1. Install

```sh
bun add typeorm @nestjs/typeorm pg
```

## 2. Run PostgreSQL (Docker)

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:latest
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql

  pg_admin:
    image: dpage/pgadmin4:latest
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: dbadmin
    depends_on:
      - db
    volumes:
      - pgadmin_data:/var/lib/pgadmin

volumes:
  db_data:
  pgadmin_data:
```

`.env` (never commit real credentials):

```sh
POSTGRES_DB=nestjs-blog
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

Package scripts:

```json
"db:up": "docker compose up -d",
"db:down": "docker compose down"
```

- Postgres: `localhost:5432`
- pgAdmin: `http://localhost:8080`

> The `username` / `password` / `database` in the TypeORM config must match the `POSTGRES_*` values in `.env`.

> If the container was created before you changed the password, run `docker compose down -v` and `bun run db:up` again — the old volume keeps the old credentials.

## 3. Connect TypeORM in `AppModule`

### Synchronous

```ts
import { TypeOrmModule } from '@nestjs/typeorm';

TypeOrmModule.forRoot({
  type: 'postgres',
  entities: [], // Add the new entities here
  synchronize: true,
  port: 5432,
  username: 'postgres',
  password: 'password',
  host: 'localhost',
  database: 'nestjs-blog',
});
```

### Asynchronous (used in this project)

```ts
TypeOrmModule.forRootAsync({
  imports: [],
  inject: [],
  useFactory: () => ({
    type: 'postgres',
    entities: [], // Add the new entities here
    synchronize: true,
    port: 5432,
    username: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'nestjs-blog',
  }),
});
```

Advantages of `forRootAsync`:

- Non-blocking / asynchronous connection setup
- Can inject dependencies (e.g. `ConfigService`) into `useFactory`

> `synchronize: true` is for development only. Use migrations in production.

## 4. Create an entity

`src/users/user.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 96, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 96, nullable: false })
  lastName: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({ type: 'varchar', nullable: false })
  role: string;
}
```

`@Entity()` maps the class to a `user` table; `synchronize: true` creates/updates it.

## 5. Register the entity

**App-level** — add it to the `entities` array in `forRootAsync`:

```ts
entities: [User],
```

**Feature-level** — expose its repository in the feature module:

```ts
// src/users/users.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
```

Alternative: set `autoLoadEntities: true` in `forRootAsync` to automatically register every entity passed to `forFeature()`.

## 6. Repository → service

Inject the repository with `@InjectRepository()`:

```ts
// src/users/providers/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const isUserExists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    // Handle the exception when the user already exists
    if (isUserExists) {
      throw new Error('User already exists');
    }

    // Create a new-user instance
    const newUser = this.userRepository.create(createUserDto);

    // Save it to the database
    return await this.userRepository.save(newUser);
  }
}
```

Repository API used: `findOne`, `create`, `save`.

## 7. Service → controller

```ts
// src/users/users.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './providers/users.service.js';
import { CreateUserDto } from './dtos/create-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  public async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

## 8. Try it

```sh
bun run db:up
bun run start:dev
```

```http
POST http://localhost:3000/users
Content-Type: application/json

{
  "firstName": "Faisal",
  "lastName": "Yasin",
  "email": "faisal@example.com",
  "password": "Password1!",
  "role": "user"
}
```

Flow: `POST /users` → `UsersController` → `UsersService` → `Repository<User>` → PostgreSQL.
