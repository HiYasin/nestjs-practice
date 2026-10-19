import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './providers/users.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  // imports: [AuthModule] // Circular dependency detected, using forwardRef to resolve it
  imports: [forwardRef(() => AuthModule)]
})
export class UsersModule {}
