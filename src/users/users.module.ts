import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './providers/users.service.js';
import { User } from './user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersCreateManyProvider } from './providers/users-create-many.provider.js';
import { AuthModule } from '../auth/auth.module.js';
import { CreateUserProvider } from './providers/create-user.provider.js';
import { FindUserByEmailProvider } from './providers/find-user-by-email.provider.js';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from '../auth/config/jwt.config.js';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersCreateManyProvider,
    CreateUserProvider,
    FindUserByEmailProvider,
    // AccessTokenGuard,
  ],
  exports: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(()=> AuthModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    
  ],
})
export class UsersModule {}
