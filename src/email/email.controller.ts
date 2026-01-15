import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidUrl(url: string): boolean {
    return /^https?:\/\/.+/.test(url);
  }

  @Post('send-welcome')
  @HttpCode(HttpStatus.OK)
  async sendWelcome(
    @Body() body: { email: string; firstName: string },
  ): Promise<{ message: string }> {
    const { email, firstName } = body;

    if (!email || !firstName) {
      throw new BadRequestException('Email and firstName are required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      await this.emailService.sendWelcomeEmail(email, firstName);
      return { message: 'Welcome email sent successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send welcome email');
    }
  }

  @Post('send-password-reset')
  @HttpCode(HttpStatus.OK)
  async sendPasswordReset(
    @Body()
    body: {
      email: string;
      firstName: string;
      resetUrl: string;
    },
  ): Promise<{ message: string }> {
    const { email, firstName, resetUrl } = body;

    if (!email || !firstName || !resetUrl) {
      throw new BadRequestException('Email, firstName, and resetUrl are required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (!this.isValidUrl(resetUrl)) {
      throw new BadRequestException('Invalid resetUrl format');
    }

    try {
      await this.emailService.sendPasswordResetEmail(email, firstName, resetUrl);
      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  @Post('send-password-changed')
  @HttpCode(HttpStatus.OK)
  async sendPasswordChanged(
    @Body() body: { email: string; firstName: string },
  ): Promise<{ message: string }> {
    const { email, firstName } = body;

    if (!email || !firstName) {
      throw new BadRequestException('Email and firstName are required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      await this.emailService.sendPasswordChangedEmail(email, firstName);
      return { message: 'Password change confirmation email sent successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send password change confirmation email');
    }
  }
}
