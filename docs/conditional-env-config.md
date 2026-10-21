# Conditional Environment Config in NestJS

Load a shared `.env` plus an environment-specific file (`.env.development`,
`.env.production`, ...) based on `NODE_ENV`.

## 1. The key rule

`NODE_ENV` must be set **before** the app starts:

1. `bun run start:dev` → `cross-env` sets `NODE_ENV=development`
2. `app.module.ts` reads `process.env.NODE_ENV`
3. `ConfigModule` loads `.env.development`, then `.env`

> Never put `NODE_ENV` inside a `.env` file. The file is chosen before `.env` is
> read, so a value inside it is too late.

## 2. Install

```sh
bun add @nestjs/config
bun add -d cross-env
```

`cross-env` makes `NODE_ENV=...` work on Windows, macOS and Linux.

## 3. Create the files

| File | Commit? | Contents |
| ---- | ------- | -------- |
| `.env.example` | yes | Template |
| `.env` | no | Shared defaults |
| `.env.development` | no | Dev overrides |
| `.env.production` | no | Prod overrides |

```sh
# .env.example
POSTGRES_DB=nestjs-blog
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

```sh
# .env (local copy with your real password)
POSTGRES_DB=nestjs-blog
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Password
```

```sh
# .env.development (only what differs from .env)
PORT=3000
```

```powershell
Copy-Item .env.example .env
```

> Do **not** put `NODE_ENV` in any of these files. It must come from the process
> environment (start script, shell, Docker, CI).

### Multiple files are loaded

`.env` is always loaded as the base, plus **only one** environment file:

| `NODE_ENV` | Files loaded |
| ---------- | ------------ |
| `development` | `.env.development` + `.env` |
| `production` | `.env.production` + `.env` (or just `.env` if it does not exist) |
| `staging` | `.env.staging` + `.env` |

It never loads every env file at once. If a key exists in both files, the
environment-specific file wins over `.env`.

### Which variables go where

| File | Put here |
| ---- | -------- |
| `.env` | Values shared by all environments and local defaults — e.g. `POSTGRES_USER`, `POSTGRES_PORT`, common feature flags |
| `.env.development` | Only development overrides — e.g. `PORT=3000`, `DB_SYNCHRONIZE=true`, `LOG_LEVEL=debug` |
| `.env.production` | Only production overrides — e.g. `PORT=8080`, `DB_SYNCHRONIZE=false`, `LOG_LEVEL=info` |
| `.env.example` | The same keys as `.env`, with placeholder values (committed) |

- Shared does not mean secret-safe: real production credentials belong in the
  hosting platform or CI, not in `.env`.
- If a value never changes between environments, keep it in `.env` only.
- If a value differs, put it in the matching `.env.<env>` file only.

## 4. Configure `AppModule`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

const ENV = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // First existing file wins. `.env` is the fallback.
      envFilePath: [`.env.${ENV}`, '.env'],
    }),
  ],
})
export class AppModule {}
```

- Existing `process.env` values beat both files.

## 5. Set `NODE_ENV` in the scripts

`package.json`:

```json
"start": "cross-env NODE_ENV=development nest start",
"start:dev": "cross-env NODE_ENV=development nest start --watch",
"start:prod": "cross-env NODE_ENV=production node dist/main"
```

Add more environments the same way:

```json
"start:staging": "cross-env NODE_ENV=staging nest start"
```

Then create `.env.staging`. No code change needed.

## 6. Read values

`ConfigModule` is global, so just inject `ConfigService`:

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(private readonly configService: ConfigService) {}

  findAll() {
    return {
      env: this.configService.get<string>('NODE_ENV'),
      port: Number(this.configService.get<string>('PORT', '3000')),
    };
  }
}
```

Values are always strings. Use `getOrThrow()` when a variable is required.
Custom config objects (like `appConfig` in `src/config/app.config.ts`) are read
the same way: `configService.getOrThrow<DatabaseConfig>('database')`.

## 7. Run and verify

```sh
bun run start:dev
```

Add a temporary log to confirm which env is active:

```ts
console.log('NODE_ENV:', process.env.NODE_ENV, 'PORT:', process.env.PORT);
```

Production:

```sh
bun run build
bun run start:prod
```

In Docker/CI, `NODE_ENV` is usually set by the platform; it wins over the files.

## 8. Common mistakes

| Problem | Fix |
| ------- | --- |
| Env never changes | Set `NODE_ENV` in the script/shell, not in `.env` |
| `NODE_ENV` logs the wrong value | Remove it from all `.env` files |
| No variables load | Check the file name and that you run from the project root |
| Changes not applied | Restart the app; env files are read once at startup |
| `cross-env` missing in production | Run `node dist/main` directly and let the platform set `NODE_ENV` |

## Notes

- Keep `.env` and `.env.development` in `.gitignore`; commit only `.env.example`.
- Real production secrets belong in the hosting platform, not the repo.
- Custom config lives in `src/config/app.config.ts`, is registered with
  `load: [appConfig]`, and is read in `TypeOrmModule.forRootAsync` through
  `ConfigService.getOrThrow('database')`. See
  [custom-config.md](./custom-config.md) for the full pattern.
