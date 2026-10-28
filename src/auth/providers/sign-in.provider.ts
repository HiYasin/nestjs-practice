import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/providers/users.service.js';
import { HashingProvider } from './hashing.provider.js';

@Injectable()
export class SignInProvider {
    constructor(

        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,

        private readonly hashingProvider: HashingProvider
    ) {}

    public async signIn(signInDto: any) {

        const user = await this.usersService.findOneByEmail(signInDto.email);
        if (!user) {
            throw new BadRequestException('User not found',{
                description: 'Invalid email or password',
            });
        }
        
        const isPasswordValid = await this.hashingProvider.comparePassword(signInDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password', {
                description: 'Invalid email or password',
            });
        }

        return {
            message: 'Sign in successful',
            user
        };
    }
}
