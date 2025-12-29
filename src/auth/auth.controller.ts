import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request as ExRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(registerDto);

    // set refresh token cookie if present
    if (result.refreshToken) {
      const refreshExpirationMs = Number(
        process.env.JWT_REFRESH_EXPIRATION_MS || 30 * 24 * 60 * 60 * 1000,
      );
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshExpirationMs,
      });
    }

    // Do not include refreshToken in response body for clients that rely on cookie
    const { refreshToken, ...body } = result as any;
    return body;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);

    if (result.refreshToken) {
      const refreshExpirationMs = Number(
        process.env.JWT_REFRESH_EXPIRATION_MS || 30 * 24 * 60 * 60 * 1000,
      );
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshExpirationMs,
      });
    }

    const { refreshToken, ...body } = result as any;
    return body;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { payload, user } = await this.authService.verifyRefreshToken(refreshToken);

    // Issue new tokens
    const tokens = this.authService['generateTokens'](payload.sub, payload.email, payload.role);

    // Persist new refresh token
    try {
      const refreshExpirationMs = Number(
        process.env.JWT_REFRESH_EXPIRATION_MS || 30 * 24 * 60 * 60 * 1000,
      );
      const refreshExpiresAt = new Date(Date.now() + refreshExpirationMs);
      await this.usersService.setRefreshToken(
        user._id.toString(),
        tokens.refreshToken,
        refreshExpiresAt,
      );
    } catch (err) {
      // ignore
    }

    // Set cookie
    const refreshExpirationMs = Number(
      process.env.JWT_REFRESH_EXPIRATION_MS || 30 * 24 * 60 * 60 * 1000,
    );
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshExpirationMs,
    });

    return { accessToken: tokens.accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    const user = await this.usersService.findOne(req.user.userId);
    return this.usersService.serializeUser(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    // Clear refresh token cookie and user stored token
    try {
      await this.usersService.clearRefreshToken(req.user.userId);
    } catch (err) {
      // ignore
    }
    // Clear cookie by setting empty with immediate expiry
    // Note: using passthrough response isn't necessary here; controller can rely on frontend to drop cookie
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }
}
