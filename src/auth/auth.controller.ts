import {Body, Controller, Get, HttpCode, Post, Req, UseGuards} from '@nestjs/common';
import { AuthService } from "./auth.service.js";
import { loginSchema, registerSchema, type LoginDto, type RegisterDto } from "./auth.schemas.js";
import {AuthGuard, type AuthRequest} from "./auth.guard.js";

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

    @Get('me')
    @UseGuards(AuthGuard)
    me(@Req() req: AuthRequest){
        return { id: req.userId };
    }

}
