import {Body, Controller, Delete, HttpCode, Post, Req, UseGuards} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from "./auth.service.js";
import {
    deleteAccountSchema, loginSchema, registerSchema,
    type DeleteAccountDto, type LoginDto, type RegisterDto } from "./auth.schemas.js";
import {AuthGuard, type AuthRequest} from "./auth.guard.js";

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
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

    @Delete('me')
    @HttpCode(204)
    @UseGuards(AuthGuard)
    deleteMe(@Req() req: AuthRequest, @Body({ schema: deleteAccountSchema }) body: DeleteAccountDto) {
        return this.auth.deleteAccount(req.userId, body.password);
    }

}
