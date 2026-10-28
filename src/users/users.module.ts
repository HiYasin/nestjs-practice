import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './providers/users.service.js';
import { User } from './user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersCreateManyProvider } from './providers/users-create-many.provider.js';
import { AuthModule } from '../auth/auth.module.js';
import { CreateUserProvider } from './providers/create-user.provider.js';
import { FindUserByEmailProvider } from './providers/find-user-by-email.provider.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersCreateManyProvider, CreateUserProvider, FindUserByEmailProvider],
  exports: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(()=> AuthModule)
  ],
})
export class UsersModule {}
