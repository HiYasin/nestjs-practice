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
