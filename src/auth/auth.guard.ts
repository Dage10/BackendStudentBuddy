import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";

export type AuthRequest = { headers: { authorization?: string }; userId: string };

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly secret: string;

    constructor(config: ConfigService) {
        this.secret = config.getOrThrow<string>("JWT_SECRET");
    }

    canActivate(context: ExecutionContext){
        const req = context.switchToHttp().getRequest<AuthRequest>();
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException();
        }
        try{
            const { sub } = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as { sub: string };
            req.userId = sub;
            return true;
        } catch {
            throw new UnauthorizedException();
        }
    }

}