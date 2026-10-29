import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { DatabaseModule } from "../database/database.module.js";
import { AuthService } from './auth.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
