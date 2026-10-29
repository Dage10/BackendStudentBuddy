import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from "./auth.service.js";
import { loginSchema, registerSchema, type LoginDto, type RegisterDto } from "./auth.schemas.js";

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    register(@Body({ schema: registerSchema }) body: RegisterDto) {
        return this.auth.register(body);
    }

    @Post('login')
    @HttpCode(200)
    login(@Body({ schema: loginSchema }) body: LoginDto) {
        return this.auth.login(body);
    }
}
