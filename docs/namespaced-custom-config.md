# Namespaced Custom Config in NestJS

Using `registerAs` to group config values under one key, for example `app`,
`database`, or `auth`.

The plain-factory version is documented in
[custom-config.md](./custom-config.md). This guide shows the namespaced variant
with a complete example.

## 1. What namespacing changes

| | Plain factory | `registerAs` |
| - | ------------- | ------------ |
| Returned keys | Merged at the top level | Grouped under the token |
| Read a value | `get('database.host')` | `get('app.database.host')` |
| Inject whole group | Not supported directly | `@Inject(appConfig.KEY)` |
| Key collisions | Possible between factories | Isolated per namespace |

`registerAs('app', factory)` returns the same factory plus a `KEY` property.
The `KEY` is both the config path (`app`) and the DI token for the group.

## 2. Create the namespaced config file

`src/config/app.config.ts`:

```ts
import { registerAs, type ConfigType } from '@nestjs/config';

const toBoolean = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value === 'true';

export const appConfig = registerAs('app', () => {
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
});

export type AppConfig = ConfigType<typeof appConfig>;
export type DatabaseConfig = AppConfig['database'];
```

The returned object keeps the same shape as before. The difference is that
`registerAs('app', ...)` wraps it under the `app` key.

> Do not nest the namespace again inside the factory. `registerAs('app', () => ({
> app: {...} }))` would produce `app.app`.

## 3. Register the config

`src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config.js';

const ENV = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${ENV}`, '.env'],
      load: [appConfig],
    }),
  ],
})
export class AppModule {}
```

Registering the factory does three things:

1. Loads the factory output under `app`.
2. Makes `configService.get('app')` and `get('app.database.host')` available.
3. Registers a provider under `appConfig.KEY`, so the group can be injected.

## 4. Read the namespaced config

### Whole group

```ts
// Make sure ConfigService is injected into the provider.
// AppConfig / DatabaseConfig are exported from src/config/app.config.ts.
const app = this.configService.getOrThrow<AppConfig>('app');
const database = this.configService.getOrThrow<DatabaseConfig>('app.database');
```

### Single value

```ts
const host = this.configService.getOrThrow<string>('app.database.host');
const port = this.configService.getOrThrow<number>('app.database.port');
```

Dot notation traverses the object. If any segment is missing, `get()` returns
`undefined`; `getOrThrow()` throws.

### Inject the whole group with `KEY`

This is the main advantage of `registerAs` — no need to fetch the group through
`ConfigService`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { appConfig, type AppConfig } from '../../config/app.config.js';

@Injectable()
export class UsersService {
  constructor(@Inject(appConfig.KEY) private readonly config: AppConfig) {}

  getEnvironment() {
    return this.config.environment;
  }

  getDatabase() {
    return this.config.database;
  }
}
```

`appConfig.KEY` is the string `'app'` at runtime. Using the constant avoids
typos and keeps the injection typed.

### In `AppModule` (TypeORM)

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { DatabaseConfig } from './config/app.config.js';

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const database = configService.getOrThrow<DatabaseConfig>('app.database');

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

You can also inject the group directly:

```ts
import { appConfig, type AppConfig } from './config/app.config.js';

TypeOrmModule.forRootAsync({
  inject: [appConfig.KEY],
  useFactory: (config: AppConfig) => ({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    entities: [User],
    synchronize: config.database.synchronize,
    autoLoadEntities: config.database.autoLoadEntities,
  }),
}),
```

### In `main.ts`

```ts
import { appConfig, type AppConfig } from './config/app.config.js';

const config = app.get<AppConfig>(appConfig.KEY);
await app.listen(config.port);
```

## 5. Add more namespaces

Each `registerAs` call gets its own key. They do not collide:

```ts
// src/config/auth.config.ts
import { registerAs, type ConfigType } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? '',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
}));

export type AuthConfig = ConfigType<typeof authConfig>;
```

```ts
// src/app.module.ts
import { authConfig } from './config/auth.config.js';

ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [`.env.${ENV}`, '.env'],
  load: [appConfig, authConfig],
}),
```

```ts
const auth = configService.getOrThrow<AuthConfig>('auth');
const secret = configService.getOrThrow<string>('auth.jwtSecret');
```

Add the variables to the env files as usual:

```sh
JWT_SECRET=dev-secret
JWT_EXPIRES_IN=1h
```

## 6. Verify

Build, then print the namespace key and the factory output:

```sh
bun run build
```

```powershell
node --env-file=.env --env-file=.env.development --input-type=module -e "const { appConfig } = await import('./dist/config/app.config.js'); console.log(appConfig.KEY, appConfig());"
```

Expected:

```sh
app {
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

At runtime, confirm the namespace is available:

```ts
console.log(this.configService.get('app.database.host'));
```

## 7. Migrating from a plain factory

1. Wrap the existing factory with `registerAs('app', ...)`.
2. Keep the inner object shape unchanged.
3. Change `AppConfig` from `ReturnType<typeof appConfig>` to
   `ConfigType<typeof appConfig>`.
4. Prefix every read path with the namespace:
   - `database.host` → `app.database.host`
   - `environment` → `app.environment`
   - `port` → `app.port`
5. Optionally replace `ConfigService` reads with `@Inject(appConfig.KEY)`.

`load: [appConfig]` does not need to change.

## 8. Common mistakes

| Problem | Cause | Fix |
| ------- | ----- | --- |
| `getOrThrow('app.database')` throws | `load: [appConfig]` is missing | Register the factory |
| `undefined` for `app.database.host` | Reading `database.host` without the namespace | Prefix paths with `app.` |
| `app.app.database` | Namespace nested twice inside the factory | Return the object directly from `registerAs('app', ...)` |
| `@Inject(appConfig.KEY)` fails | Factory not registered in `load` | Add it to `ConfigModule.forRoot` |
| Two configs overwrite each other | Both use the same `registerAs` token | Use unique tokens (`app`, `auth`, `mail`) |
| Type error on `ConfigType` | Imported from the wrong package | Import it from `@nestjs/config` |
| Config is `undefined` in a service | `ConfigModule` is not global and not imported | Set `isGlobal: true` or import `ConfigModule` |

## 9. Checklist

1. Wrap the factory with `registerAs('app', () => ({ ... }))`.
2. Export the type with `ConfigType<typeof appConfig>`.
3. Register the factory in `ConfigModule.forRoot({ load: [appConfig] })`.
4. Prefix all reads with `app.` (or use the `KEY` token).
5. Add new variables to `.env`, `.env.development`, and `.env.example`.
6. Use a unique token for every config file.
7. Verify `appConfig.KEY` and the output after building.
