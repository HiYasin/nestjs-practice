import { Injectable } from '@nestjs/common';
import { SignInProvider } from './providers/sign-in.provider.js';
import { SignInDto } from './dto/sing-in.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly signInProvider: SignInProvider
  ) {}
  public async signIn(signInDto: SignInDto) {
    return await this.signInProvider.signIn(signInDto);
  }
}
