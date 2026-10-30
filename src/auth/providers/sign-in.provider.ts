import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/providers/users.service.js';
import { HashingProvider } from './hashing.provider.js';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config.js';

@Injectable()
export class SignInProvider {
    constructor(

        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,

        private readonly hashingProvider: HashingProvider,
        private readonly jwtService: JwtService,
        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>
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

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
        },{
            secret: this.jwtConfiguration.secret,
            audience: this.jwtConfiguration.audience,
            issuer: this.jwtConfiguration.issuer,
            expiresIn: this.jwtConfiguration.accessTokenTtl,
        });

        return {
            message: 'Sign in successful',
            user,
            accessToken,
        };
    }
}
