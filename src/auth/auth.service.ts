import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service.js';
import type { LoginDto, RegisterDto } from './auth.schemas.js'

const ARGON = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

const DUMMY_HASH = await argon2.hash('dummy-password', ARGON);

@Injectable()
export class AuthService {
    private readonly secret: string;

    constructor(
        private readonly db: DatabaseService,
        config: ConfigService){
        this.secret = config.getOrThrow<string>('JWT_SECRET');
        if (this.secret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters long');
        }
    }

    async register({username, email, password}: RegisterDto){
        const hash = await argon2.hash(password, ARGON);
        const { rows } = await this.db.query(
            `INSERT INTO users (username, email, password_hash)
                  VALUES ($1, $2, $3)
                  ON CONFLICT DO NOTHING
                  RETURNING id, username`,
                  [username, email, hash],
        );
        if (!rows[0]) {
            throw new ConflictException("Username or email already in use");
        }
        return rows[0];
    }

    async login({username, password} : LoginDto){
        const { rows } = await this.db.query(
            'SELECT id, password_hash FROM users WHERE lower(username) = lower($1)',
            [username],
        );
        const user = rows[0];
        const valid = await argon2.verify(user?.password_hash ?? DUMMY_HASH, password);
        if (!user || !valid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const accessToken = jwt.sign({}, this.secret, {
           algorithm: 'HS256',
           subject: user.id,
           expiresIn: '7d',
        });
        return { accessToken };
    }

}
