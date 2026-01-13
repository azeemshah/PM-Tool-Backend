import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  sendTempPassword(email: string, tempPassword: string) {
    throw new Error('Method not implemented.');
  }
  async sendInvite(email: string, role: string, inviteLink: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'You\'re Invited to Join PM Tool',
        html: this.getInviteEmailTemplate(role, inviteLink),
      });
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error.stack);
      throw error;
    }
  }
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Welcome to PM Tool!',
        html: this.getWelcomeEmailTemplate(firstName),
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error.stack);
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetUrl: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Reset Your Password',
        html: this.getPasswordResetTemplate(firstName, resetUrl),
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
    }
  }

  async sendPasswordChangedEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Password Changed Successfully',
        html: this.getPasswordChangedTemplate(firstName),
      });
      this.logger.log(`Password changed confirmation sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed email to ${email}`, error.stack);
    }
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to PM Tool!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for registering with PM Tool - your comprehensive project management solution.</p>
            <p>You can now:</p>
            <ul>
              <li>Create and manage projects</li>
              <li>Track tasks and issues</li>
              <li>Collaborate with your team</li>
              <li>Plan sprints and manage workflows</li>
            </ul>
            <p>Get started by logging into your account and exploring the features.</p>
            <a href="${this.configService.get('FRONTEND_URL')}/login" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordChangedTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .success { background-color: #d4edda; padding: 10px; border-left: 4px solid #28a745; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <div class="success">
              <strong>Success!</strong> Your password has been changed successfully.
            </div>
            <p>Your account password was recently changed. If you made this change, you can safely ignore this email.</p>
            <p>If you didn't change your password, please contact our support team immediately.</p>
            <a href="${this.configService.get('FRONTEND_URL')}/login" class="button">Go to Login</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getInviteEmailTemplate(role: string, inviteLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .role { background-color: #e9ecef; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited to Join PM Tool!</h1>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>You've been invited to join PM Tool as a <strong>${role}</strong>.</p>
            <div class="role">
              <strong>Role:</strong> ${role}
            </div>
            <p>Click the button below to accept your invitation and get started:</p>
            <a href="${inviteLink}" class="button">Accept Invitation</a>
            <p>This invitation will expire in 7 days. If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
