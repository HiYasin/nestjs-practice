import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig, DatabaseConfig } from './config/app.config.js';

const ENV = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes the ConfigModule available globally, so you don't have to import it in every module
      // NODE_ENV must be set by the process (see the start:* scripts). The first existing file wins,
      // so environment-specific values override the shared defaults in .env.
      envFilePath: [`.env.${ENV}`, '.env'],
      load: [appConfig],
    }),
    UsersModule,
    PostsModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
