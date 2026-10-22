# Custom Config for Environment Variables in NestJS

Instead of reading `process.env` all over the codebase, define a typed config
factory once and inject it with `ConfigService`.

This guide follows the implementation in this project:
`src/config/app.config.ts` + `ConfigModule.forRoot({ load: [appConfig] })`.

## 1. How it fits together

| Step | What happens |
| ---- | ------------ |
| 1 | `NODE_ENV` selects the env files (see [conditional-env-config.md](./conditional-env-config.md)) |
| 2 | `ConfigModule` loads `.env.<env>` + `.env` |
| 3 | The `appConfig` factory runs and reads `process.env` |
| 4 | The returned object is stored in `ConfigService` |
| 5 | Modules/services read it with `configService.get...()` |

The factory runs **once at startup**, after the env files are loaded.

## 2. Create the config file

`src/config/app.config.ts` (current implementation):

```ts
const toBoolean = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value === 'true';

export const appConfig = () => {
  const environment = process.env.NODE_ENV ?? 'development';

  return {
    environment,
    port: parseInt(process.env.PORT ?? '3000', 10),
    database: {
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      username: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? 'password',
      name: process.env.POSTGRES_DB ?? 'nestjs-blog',
      synchronize: toBoolean(
        process.env.DB_SYNCHRONIZE,
        environment !== 'production',
      ),
      autoLoadEntities: toBoolean(process.env.DB_AUTOLOADENTITIES, false),
    },
  };
};

export type AppConfig = ReturnType<typeof appConfig>;
export type DatabaseConfig = AppConfig['database'];
```

Why it is written this way:

- **One place for env access** — no scattered `process.env` reads.
- **Environment names match `.env`** — `POSTGRES_USER`, `POSTGRES_DB`, etc.
- **Sensible defaults** — the app starts without every optional variable.
- **Converted types** — `parseInt` for numbers, `toBoolean` for flags, because
  env values are always strings.
- **Exported types** — `DatabaseConfig` gives typed access at the consumer side.
- **Environment-aware defaults** — `synchronize` is on in development and off
  in production, unless `DB_SYNCHRONIZE` says otherwise.

## 3. Register the config

`src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config.js';
import { envSchema } from './config/env.validation.js';

const ENV = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${ENV}`, '.env'],
      validationSchema: envSchema,
      load: [appConfig],
    }),
  ],
})
export class AppModule {}
```

- `validationSchema` validates the merged env object before anything else.
- `load` accepts an array, so you can register several config factories.
- Each factory's returned keys are merged into the top level of the config.
- `isGlobal: true` lets every module inject `ConfigService` without importing
  `ConfigModule` again.
- Files are read first, then validated, then the config factories run.

## 4. Read the config

### In `AppModule` (TypeORM)

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './config/app.config.js';

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const database = configService.getOrThrow<DatabaseConfig>('database');

    return {
      type: 'postgres',
      host: database.host,
      port: database.port,
      username: database.username,
      password: database.password,
      database: database.name,
      entities: [User],
      synchronize: database.synchronize,
      autoLoadEntities: database.autoLoadEntities,
    };
  },
}),
```

`getOrThrow()` is used because the config is required. It fails fast if
`appConfig` is not registered or the key is missing.

### In a service

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DatabaseConfig } from '../../config/app.config.js';

@Injectable()
export class UsersService {
  constructor(private readonly configService: ConfigService) {}

  getEnvironment() {
    return this.configService.getOrThrow<string>('environment');
  }

  getDatabase() {
    return this.configService.getOrThrow<DatabaseConfig>('database');
  }
}
```

Read the whole group once instead of calling `get()` for every field:

```ts
const { host, port } = this.configService.getOrThrow<DatabaseConfig>('database');
```

Dot notation also works, but returns one value at a time:

```ts
this.configService.get<string>('database.host');
```

## 5. Add another config group

Create another factory and add it to `load`:

```ts
// src/config/auth.config.ts
export const authConfig = () => ({
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
});

export type AuthConfig = ReturnType<typeof authConfig>['auth'];
```

```ts
// src/app.module.ts
import { authConfig } from './config/auth.config.js';

ConfigModule.forRoot({
  // ...
  load: [appConfig, authConfig],
});
```

```ts
const auth = configService.getOrThrow<AuthConfig>('auth');
```

> With plain factories, all returned keys share the same top-level namespace.
> Keep key names unique (`database`, `auth`, `mail`, ...) to avoid collisions.
>
> For the `registerAs` approach, see
> [namespaced-custom-config.md](./namespaced-custom-config.md).

## 6. Add the variables to the env files

When the config reads a new variable, add it to the right files:

| File | Example | Notes |
| ---- | ------- | ----- |
| `.env` | `POSTGRES_HOST=localhost` | Shared defaults |
| `.env.development` | `LOG_LEVEL=debug` | Dev overrides only |
| `.env.production` | `LOG_LEVEL=info` | Prod overrides; prefer host secrets |
| `.env.example` | `POSTGRES_HOST=localhost` | Committed template |

Rules:

- Do not put `NODE_ENV` in these files; it is set by the start scripts.
- Values are strings — parse numbers and booleans in the config factory.
- If a variable is optional, give it a default with `??`.
- If it is required, omit the default and use `getOrThrow()` when reading.

## 7. Validate at startup

This project validates env variables with Zod. The schema lives in
`src/config/env.validation.ts` and is registered in `ConfigModule.forRoot()`
with `validationSchema: envSchema`.

See [env-validation-zod.md](./env-validation-zod.md) for the full setup,
defaults, failure output, and troubleshooting.

## 8. Verify the config

Build and print the factory output with the env files loaded:

```sh
bun run build
```

```powershell
node --env-file=.env --env-file=.env.development --input-type=module -e "const { appConfig } = await import('./dist/config/app.config.js'); console.log(appConfig());"
```

Expected:

```js
{
  environment: 'development',
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Password',
    name: 'nestjs-blog',
    synchronize: true,
    autoLoadEntities: false
  }
}
```

At runtime, a quick log also helps:

```ts
console.log('env:', process.env.NODE_ENV, 'port:', process.env.PORT);
```

## 9. Common mistakes

| Problem | Cause | Fix |
| ------- | ----- | --- |
| `getOrThrow('database')` throws | `load: [appConfig]` missing, or the key name is wrong | Register the factory and check the returned key |
| Values are `undefined` | The variable is not in `.env` / `.env.<env>` | Add it, or give the config a default |
| Number/boolean is a string | `process.env` always returns strings | Use `parseInt`, `Number`, or a `toBoolean` helper |
| Config ignores `.env.development` | `envFilePath` missing or `NODE_ENV` unset | See [conditional-env-config.md](./conditional-env-config.md) |
| New config group overwrote another | Both factories return the same top-level key | Use unique keys or `registerAs` |
| `synchronize: true` in production | Default was not made environment-aware | Default to `environment !== 'production'` |
| `ConfigService` is not available | `ConfigModule` is not global and the module does not import it | Set `isGlobal: true` or import `ConfigModule` |

## 10. Checklist

1. Create `src/config/<name>.config.ts` with a factory + exported type.
2. Read `process.env.*` only inside that factory.
3. Convert numbers and booleans; provide defaults for optional values.
4. Register the factory in `ConfigModule.forRoot({ load: [...] })`.
5. Add the variables to `.env`, `.env.development`, `.env.example` as needed.
6. Consume config with `ConfigService.getOrThrow<T>('key')`.
7. Keep top-level keys unique across factories.
8. Validate required variables at startup for production.
