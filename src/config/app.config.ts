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
