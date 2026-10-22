# Environment Variable Validation with Zod in NestJS

Fail fast at startup instead of discovering a missing or malformed variable in
production. This project validates env variables with a Zod schema in
`src/config/env.validation.ts`.

The env-file selection itself is covered in
[conditional-env-config.md](./conditional-env-config.md). Custom config objects
are covered in [custom-config.md](./custom-config.md).

## 1. Install

```sh
bun add zod
```

`@nestjs/config` 12 accepts any [Standard Schema](https://standardschema.dev/)
through `validationSchema`. Use **Zod 4**, which implements it natively.

## 2. Create the schema

`src/config/env.validation.ts` (current implementation):

```ts
import { z } from 'zod';

const booleanFromEnv = (defaultValue: boolean) =>
  z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? defaultValue : value === 'true',
    );

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  POSTGRES_HOST: z.string().min(1).default('localhost'),
  POSTGRES_PORT: z.coerce.number().int().positive().max(65535).default(5432),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  DB_SYNCHRONIZE: booleanFromEnv(process.env.NODE_ENV !== 'production'),
  DB_AUTOLOADENTITIES: booleanFromEnv(false),
});

export type EnvConfig = z.infer<typeof envSchema>;
```

What each part does:

- `z.enum(...)` rejects unknown environments such as `example2`.
- `z.coerce.number()` converts the string `"3000"` into `3000`, then the
  validators check it is a positive integer.
- `.default(...)` fills missing optional variables.
- Required variables have no `.default()`, so startup fails if they are absent.
- `booleanFromEnv` accepts only `"true"` / `"false"` and returns a boolean.
- `EnvConfig` is the inferred type if you need it elsewhere.

## 3. Register the schema

`src/app.module.ts`:

```ts
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.validation.js';
import { appConfig } from './config/app.config.js';

ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [`.env.${ENV}`, '.env'],
  validationSchema: envSchema,
  load: [appConfig],
}),
```

No `validate:` wrapper is needed — Zod 4 is a Standard Schema, so Nest passes it
directly to the validator.

## 4. What happens at startup

1. `envFilePath` files are loaded into one config object.
2. Existing `process.env` values are merged on top (they win).
3. `envSchema` validates the merged object.
4. Missing defaults are filled and strings are converted.
5. Validated values are assigned back to `process.env` (numbers/booleans are
   stringified there) and stored in `ConfigService`.
6. `load: [appConfig]` factories run, so they see the validated values.

If validation fails, the app does not bootstrap.

## 5. Validated variables

| Variable | Rule | Default |
| -------- | ---- | ------- |
| `NODE_ENV` | `development`, `test`, `staging`, `production` | `development` |
| `PORT` | integer, `1`–`65535` | `3000` |
| `POSTGRES_HOST` | non-empty string | `localhost` |
| `POSTGRES_PORT` | integer, `1`–`65535` | `5432` |
| `POSTGRES_DB` | non-empty string | required |
| `POSTGRES_USER` | non-empty string | required |
| `POSTGRES_PASSWORD` | non-empty string | required |
| `DB_SYNCHRONIZE` | `"true"` / `"false"` | `true` outside production |
| `DB_AUTOLOADENTITIES` | `"true"` / `"false"` | `false` |

Add the required keys to `.env` / `.env.example`:

```sh
POSTGRES_DB=nestjs-blog
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

Optional keys can stay out of the files; their defaults apply.

## 6. Read validated values

`ConfigService` returns the **validated** values, so numbers and booleans are
already converted:

```ts
const port = this.configService.getOrThrow<number>('PORT');
const synchronize = this.configService.getOrThrow<boolean>('DB_SYNCHRONIZE');
const password = this.configService.getOrThrow<string>('POSTGRES_PASSWORD');
```

`process.env` keeps the string form (`'3000'`, `'true'`). This is why
`app.config.ts` can still call `parseInt` / `toBoolean` on `process.env` without
breaking.

## 7. Failure output

With `POSTGRES_*` missing, startup stops with:

```text
Config validation error: POSTGRES_DB: Invalid input: expected string, received undefined
POSTGRES_USER: Invalid input: expected string, received undefined
POSTGRES_PASSWORD: Invalid input: expected string, received undefined
```

An invalid port reports:

```text
Config validation error: PORT: Invalid input: expected number, received NaN
```

## 8. Verify

Build, then validate the real env files without starting the app:

```sh
bun run build
```

```powershell
node --env-file=.env --env-file=.env.development --input-type=module -e "const { ConfigModule } = await import('@nestjs/config'); const { envSchema } = await import('./dist/config/env.validation.js'); await ConfigModule.forRoot({ envFilePath: ['.env.development', '.env'], validationSchema: envSchema }); console.log({ NODE_ENV: process.env.NODE_ENV, PORT: process.env.PORT, DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE });"
```

Expected:

```sh
{ NODE_ENV: 'development', PORT: '3000', DB_SYNCHRONIZE: 'true' }
```

Test a failure by checking the schema directly:

```powershell
node --input-type=module -e "const { envSchema } = await import('./dist/config/env.validation.js'); const result = envSchema.safeParse({ PORT: 'abc' }); console.log(result.success ? 'ok' : result.error.issues.map(i => i.path.join('.') + ': ' + i.message));"
```

## 9. Adding a new variable

1. Add it to `envSchema` with a type and a default (or leave it required).
2. Add it to `.env.example` (and `.env` / `.env.<env>` when needed).
3. Read it from `ConfigService` (preferred) or add it to `app.config.ts`.

Example, adding a feature flag:

```ts
FEATURE_SIGNUP: booleanFromEnv(false),
```

```ts
const signupEnabled = this.configService.getOrThrow<boolean>('FEATURE_SIGNUP');
```

## 10. Common mistakes

| Problem | Cause | Fix |
| ------- | ----- | --- |
| `DB_SYNCHRONIZE=false` still enables sync | `z.coerce.boolean()` turns `"false"` into `true` | Use the `booleanFromEnv` helper |
| Validation never runs | Schema not passed to `validationSchema` | Add it to `ConfigModule.forRoot()` |
| Valid values reported as `undefined` | Variable is not in the schema | Add it to `envSchema` |
| Unknown variables disappear from the type | Zod strips unknown keys from the validated object | Nest merges the original config back; no action needed |
| App fails with `Invalid input: expected number` | Coercion ran on a non-numeric value | Fix the env value or its format |
| `NODE_ENV` is rejected | It is set to an unlisted value | Extend the enum or fix the start script |
| Zod type error on `validationSchema` | Using Zod 3 instead of Zod 4 | Upgrade to Zod 4 |

## 11. Checklist

1. `zod` installed.
2. `src/config/env.validation.ts` defines every variable the app reads.
3. Required variables have no default; optional ones do.
4. Booleans use the `"true"` / `"false"` helper, not `z.coerce.boolean()`.
5. `validationSchema: envSchema` is registered in `ConfigModule.forRoot()`.
6. `.env.example` documents the required keys with placeholder values.
7. Startup fails with a clear message when a required variable is missing.
8. New variables are added to the schema before being used in code.
