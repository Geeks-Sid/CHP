import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { JwtService } from './services/jwt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { DatabaseModule } from '../database/database.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests
      },
      {
        name: 'medium',
        ttl: 600000, // 10 minutes
        limit: 50, // 50 requests
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtService,
    RefreshTokenService,
    AccountLockoutService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard, JwtService],
})
export class AuthModule {}

