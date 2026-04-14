import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Create user
    const user = await this.usersService.create(registerDto);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.usersService.setEmailVerificationToken(user._id.toString(), verificationToken);

    // Send verification email
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
    await this.emailService.sendVerificationEmail(user.email, user.firstName, verificationUrl);

    // Generate tokens
    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

    // Persist refresh token for future refresh flow
    try {
      const refreshExpirationMs = Number(
        this.configService.get('JWT_REFRESH_EXPIRATION_MS', `${30 * 24 * 60 * 60 * 1000}`),
      );
      const refreshExpiresAt = new Date(Date.now() + refreshExpirationMs);
      await this.usersService.setRefreshToken(
        user._id.toString(),
        tokens.refreshToken,
        refreshExpiresAt,
      );
    } catch (err) {
      // swallow - non-fatal
    }

    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.markEmailAsVerified(user._id.toString());

    // Optionally send welcome email after verification
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return { message: 'Email verified successfully' };
  }

  async login(loginDto: LoginDto): Promise<{ message: string; email: string }> {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.usersService.setOtp(user._id.toString(), otp, otpExpires);
    await this.emailService.sendLoginOtp(user.email, user.firstName, otp);

    return { message: 'OTP sent to your email', email: user.email };
  }

  async verifyLoginOtp(email: string, otp: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithoutPassword(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    // Check OTP (ensure we access the field directly, might need to cast or ensure it's selected)
    // Since it's not select: false, it should be returned.
    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP
    await this.usersService.clearOtp(user._id.toString());

    // Update last login
    await this.usersService.updateLastLogin(user._id.toString());

    // Generate tokens
    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

    // Persist refresh token
    try {
      const refreshExpirationMs = Number(
        this.configService.get('JWT_REFRESH_EXPIRATION_MS', `${30 * 24 * 60 * 60 * 1000}`),
      );
      const refreshExpiresAt = new Date(Date.now() + refreshExpirationMs);
      await this.usersService.setRefreshToken(
        user._id.toString(),
        tokens.refreshToken,
        refreshExpiresAt,
      );
    } catch (err) {
      // swallow
    }

    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Find user
    const user = await this.usersService.findByEmailWithoutPassword(email);
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiration (1 hour)
    const expirationMs = Number(this.configService.get('PASSWORD_RESET_EXPIRATION', '3600000'));

    const expiresAt = new Date(Date.now() + expirationMs);

    await this.usersService.setPasswordResetToken(email, hashedToken, expiresAt);

    // Send reset email
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordResetEmail(email, user.firstName, resetUrl);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await this.usersService.findByResetToken(hashedToken);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    await this.usersService.updatePassword(user._id.toString(), newPassword);

    // Clear reset token
    await this.usersService.clearPasswordResetToken(user._id.toString());

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(user.email, user.firstName);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    if (currentPassword === newPassword) {
      throw new BadRequestException('Current password and new password must be different');
    }

    // Get user with password
    const user = await this.usersService.findByEmail(
      (await this.usersService.findOne(userId)).email,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    await this.usersService.updatePassword(userId, newPassword);

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(user.email, user.firstName);

    return { message: 'Password changed successfully' };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await user.comparePassword(password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Ensure token exists on user and not expired
      const user = await this.usersService.findByRefreshToken(token);
      if (!user) throw new UnauthorizedException('Invalid refresh token');

      return { payload, user };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  public generateTokens(
    userId: string,
    email: string,
    role: string,
  ): { accessToken: string; refreshToken: string } {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '30d'),
    });

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
