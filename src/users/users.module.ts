import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './providers/users.service.js';
import { User } from './user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersCreateManyProvider } from './providers/users-create-many.provider.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersCreateManyProvider],
  exports: [UsersService],
  imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
