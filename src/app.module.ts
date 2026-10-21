import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity.js';
import { ConfigModule } from '@nestjs/config';

const ENV = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes the ConfigModule available globally, so you don't have to import it in every module
      // NODE_ENV must be set by the process (see the start:* scripts). The first existing file wins,
      // so environment-specific values override the shared defaults in .env.
      envFilePath: [`.env.${ENV}`, '.env'],
    }),
    UsersModule,
    PostsModule,
    TypeOrmModule.forRootAsync({
      imports: [],
      inject: [],
      useFactory: () => ({
        type: 'postgres',
        // Registers every entity passed to TypeOrmModule.forFeature() in feature modules
        // autoLoadEntities: true,
        entities: [User],
        synchronize: true,
        port: 5432,
        username: 'postgres',
        password: 'Password',
        host: 'localhost',
        database: 'nestjs-blog'
      })
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
