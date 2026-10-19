import { Controller, Post } from '@nestjs/common';
import { AuthService } from './providers/auth.service.js';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('/login')
    public login(email: string, password: string) {
        return this.authService.login(email, password);
    }
}
