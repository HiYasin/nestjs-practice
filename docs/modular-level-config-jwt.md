# Modular-Level Configuration with JWT in NestJS

Use modular-level configuration when a group of settings belongs to one feature
module. In this project, JWT settings belong to `AuthModule`, so they are
defined in `src/auth/config/jwt.config.ts` and registered inside that module.

This pattern works together with the global configuration in
`src/app.module.ts`:

- **Global config** loads environment files and validates environment variables.
- **Modular config** maps feature-specific variables into a typed configuration
  object and makes it available to that feature module.

## 1. The configuration flow

```text
.env files / process.env
        |
        v
ConfigModule.forRoot({ validationSchema: envSchema })
        |
        v
ConfigModule.forFeature(jwtConfig) inside AuthModule
        |
        +--> JwtModule.registerAsync(jwtConfig.asProvider())
        |
        +--> SignInProvider injects jwtConfig.KEY
```

`ConfigModule.forRoot()` should be called once in `AppModule`. Feature modules
should use `ConfigModule.forFeature(...)` for their own configuration factories.

## 2. Validate JWT environment variables globally

`validationSchema` belongs to the root `ConfigModule`. Add JWT variables to the
existing Zod schema in `src/config/env.validation.ts`:

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),

  // Existing database variables...
  POSTGRES_HOST: z.string().min(1).default('localhost'),
  POSTGRES_PORT: z.coerce.number().int().positive().max(65535).default(5432),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),

  // JWT variables
  JWT_SECRET: z.string().min(32),
  JWT_TOKEN_AUDIENCE: z.string().min(1),
  JWT_TOKEN_ISSUER: z.string().min(1),
  JWT_ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(3600),
});
```

Do not use a short development fallback for `JWT_SECRET`. A missing or weak
secret should stop the application at startup instead of silently making JWT
tokens insecure.

The root module continues to register the schema:

```ts
// src/app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [`.env.${ENV}`, '.env'],
  validationSchema: envSchema,
  load: [appConfig],
});
```

Zod validation happens before feature configuration factories are used. See
[env-validation-zod.md](./env-validation-zod.md) for the complete validation
setup.

## 3. Create the JWT configuration factory

Create or update `src/auth/config/jwt.config.ts`:

```ts
import { registerAs, type ConfigType } from '@nestjs/config';

const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET!,
  audience: process.env.JWT_TOKEN_AUDIENCE!,
  issuer: process.env.JWT_TOKEN_ISSUER!,
  accessTokenTtl: Number(process.env.JWT_ACCESS_TOKEN_TTL),
}));

export default jwtConfig;
export type JwtConfig = ConfigType<typeof jwtConfig>;
```

`registerAs('jwt', ...)` creates a namespaced configuration factory. Its values
are available under the `jwt` namespace, and `jwtConfig.KEY` provides the
corresponding dependency-injection token.

The non-null assertions (`!`) are safe here because `envSchema` has already
validated these variables before the factory is used. The factory should not
repeat validation or provide insecure defaults.

## 4. Register the config in `AuthModule`

`ConfigModule.forFeature(jwtConfig)` loads the JWT configuration for the
feature module. `JwtModule.registerAsync(jwtConfig.asProvider())` uses the same
factory to configure `JwtService`:

```ts
// src/auth/auth.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config.js';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  // providers and controllers...
})
export class AuthModule {}
```

`asProvider()` expands to the dependencies and factory needed by
`JwtModule.registerAsync`. It avoids manually repeating `ConfigService` lookup
code in the module.

## 5. Use the typed JWT configuration in a provider

Inject the namespace token when application code needs the complete JWT config:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config.js';

@Injectable()
export class SignInProvider {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  getTokenSettings() {
    return {
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      accessTokenTtl: this.jwtConfiguration.accessTokenTtl,
    };
  }
}
```

The same object can be read through `ConfigService` using its namespace:

```ts
const jwt = this.configService.getOrThrow<JwtConfig>('jwt');
const secret = this.configService.getOrThrow<string>('jwt.secret');
```

Injection through `jwtConfig.KEY` is usually preferable inside the auth module
because it is typed and avoids string-based paths.

## 6. Add the environment variables

Document the variables in `.env.example`:

```sh
JWT_SECRET=replace-with-a-secret-at-least-32-characters-long
JWT_TOKEN_AUDIENCE=nestjs-blog-api
JWT_TOKEN_ISSUER=nestjs-blog
JWT_ACCESS_TOKEN_TTL=3600
```

Use a different secret in every real environment. Do not commit real secrets to
`.env.example` or the repository.

## 7. Why validation and modular config are separate

`ConfigModule.forFeature(jwtConfig)` is not a second global validation system.
It only loads and namespaces the JWT configuration factory.

| Concern | Location | Responsibility |
| ------- | -------- | -------------- |
| Env-file loading | `AppModule` | Loads `.env.<env>` and `.env` |
| Environment validation | `env.validation.ts` | Validates raw environment variables with Zod |
| JWT mapping | `jwt.config.ts` | Maps env variables to `secret`, `issuer`, and other app names |
| JWT module setup | `AuthModule` | Supplies settings to `JwtModule` |
| JWT usage | Auth providers | Signs and verifies tokens |

This keeps the root module responsible for application startup and the auth
module responsible for auth-specific wiring.

## 8. Common mistakes

| Problem | Cause | Fix |
| ------- | ----- | --- |
| `jwtConfig.KEY` cannot be injected | `ConfigModule.forFeature(jwtConfig)` is missing | Register the feature config in `AuthModule` |
| JWT values are `undefined` | Variables are not in the env files or schema | Add them to `envSchema` and `.env.example` |
| Zod validation never runs | JWT schema is created but not included in the root schema | Add JWT keys to `envSchema`, which is passed as `validationSchema` |
| `JwtModule` has no JWT options | `JwtModule.registerAsync` is not using the config provider | Use `JwtModule.registerAsync(jwtConfig.asProvider())` |
| `jwt.secret` is missing | The namespace is not registered or the path is wrong | Register the factory and use `jwt.secret` |
| A weak default secret is used | `process.env.JWT_SECRET || 'default_secret'` hides configuration errors | Make `JWT_SECRET` required and validate its length |
| `accessTokenTtl` is a string | Environment variables are strings | Use `z.coerce.number()` in the schema and `Number(...)` in the factory |

## 9. Checklist

1. Add JWT variables to `envSchema`.
2. Make `JWT_SECRET` required and sufficiently long.
3. Define `jwtConfig` with `registerAs('jwt', ...)`.
4. Export `ConfigType<typeof jwtConfig>` when a reusable type is needed.
5. Add `ConfigModule.forFeature(jwtConfig)` to `AuthModule`.
6. Configure `JwtModule` with `jwtConfig.asProvider()`.
7. Inject `jwtConfig.KEY` in auth providers.
8. Add placeholder variables to `.env.example`.
9. Run `bun run build` and verify startup fails when a required JWT variable is missing.

Related guides:

- [env-validation-zod.md](./env-validation-zod.md)
- [namespaced-custom-config.md](./namespaced-custom-config.md)
- [custom-config.md](./custom-config.md)
