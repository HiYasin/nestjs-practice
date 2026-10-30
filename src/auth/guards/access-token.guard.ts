import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config.js';
import type { Request } from 'express';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    // Extract the request object from the execution context
    const request = context.switchToHttp().getRequest();

    // Extract the access token from the request headers
    const accessToken = this.extractRequestFromHeader(request);

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      // Verify the token using the JwtService and the secret from the configuration
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      request.user = payload; // Attach the payload to the request object for further use

    } catch (error) {
      // If the token is invalid or expired, return unauthorized
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }

  private extractRequestFromHeader(request: Request): string | undefined {
    const [_, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
