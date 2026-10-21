import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity.js';

@Module({
  imports: [
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
