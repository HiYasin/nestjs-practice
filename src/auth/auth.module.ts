import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { HashingProvider } from './providers/hashing.provider.js';
import { BycryptProvider } from './providers/bycrypt.provider.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService, 
    // HashingProvider, // Contains the method signature for hashing and comparing passwords
    // BycryptProvider, // Contains the actual implementation of the hashing and comparing passwords methods
    // Using the abstract class is not possible because the providers array doesn't take any abstract class as a provider since the Provider type doesn't allow it.
    // To solve this issue, we can use the useClass property to specify the concrete implementation of the abstract class.
    {
      provide: HashingProvider, // The abstract class is used as a token to identify the provider
      useClass: BycryptProvider, // The concrete implementation of the abstract class is specified using the useClass property
    }
  ],

  imports: [forwardRef(() => UsersModule)], // forwardRef is used to resolve circular dependency
  exports: [AuthService, HashingProvider], // Exporting the AuthService and HashingProvider so that they can be used in other modules
})
export class AuthModule {}
