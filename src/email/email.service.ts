import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  sendTempPassword(email: string, tempPassword: string) {
    throw new Error('Method not implemented.');
  }
  async sendInvite(
    email: string,
    role: string,
    inviteLink: string,
    workspaceInviteCode?: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: "You're Invited to Join PM Tool",
        html: this.getInviteEmailTemplate(role, inviteLink, workspaceInviteCode),
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

  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationUrl: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Verify Your Email Address',
        html: this.getVerificationEmailTemplate(firstName, verificationUrl),
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error.stack);
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

  async sendLoginOtp(email: string, firstName: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Your Login OTP',
        html: this.getLoginOtpTemplate(firstName, otp),
      });
      this.logger.log(`Login OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send login OTP to ${email}`, error.stack);
      throw error;
    }
  }

  async sendActivityEmail(
    recipients: Array<{ email: string; name?: string }>,
    subject: string,
    html: string,
  ): Promise<void> {
    for (const r of recipients) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get('EMAIL_FROM'),
          to: r.email,
          subject,
          html,
        });
        this.logger.log(`Activity email sent to ${r.email}`);
      } catch (error) {
        this.logger.error(`Failed to send activity email to ${r.email}`, error.stack);
      }
    }
  }

  buildActivityTemplate(params: {
    action: string;
    title: string;
    actorName?: string;
    workspaceName?: string;
    boardName?: string;
    details?: string;
    url?: string;
  }): string {
    const actor = params.actorName || 'Someone';
    const details = params.details || '';
    const workspace = params.workspaceName
      ? `<p><strong>Workspace:</strong> ${params.workspaceName}</p>`
      : '';
    const board = params.boardName ? `<p><strong>Board:</strong> ${params.boardName}</p>` : '';
    const link = params.url
      ? `<div style="margin-top:16px;"><a href="${params.url}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Open</a></div>`
      : '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>PM Tool Activity</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height:1.6; color:#111; max-width:640px; margin:0 auto; padding:24px;">
          <h2 style="margin:0 0 8px 0;">${params.action}</h2>
          <p style="margin:0 0 12px 0;"><strong>Item:</strong> ${params.title}</p>
          <p style="margin:0 0 12px 0;"><strong>By:</strong> ${actor}</p>
          ${workspace}
          ${board}
          ${details ? `<div style="margin-top:12px;padding:12px;background:#f3f4f6;border-radius:8px;">${details}</div>` : ''}
          ${link}
          <div style="margin-top:24px;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} PM Tool</div>
        </body>
      </html>
    `;
  }

  private getLoginOtpTemplate(firstName: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Login OTP</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">PM Tool</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0;">Hello ${firstName},</h2>
          <p>You requested a login OTP. Please use the following code to complete your login:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background-color: #2563eb; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
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

  private getVerificationEmailTemplate(firstName: string, verificationUrl: string): string {
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
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for signing up! Please verify your email address to activate your account.</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p>${verificationUrl}</p>
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

  private getInviteEmailTemplate(
    role: string,
    inviteLink: string,
    workspaceInviteCode?: string,
  ): string {
    // Use workspace inviteCode if available, otherwise fall back to token link
    const acceptLink = workspaceInviteCode
      ? `${this.configService.get('FRONTEND_URL')}/invite/workspace/${workspaceInviteCode}/join`
      : inviteLink;
    const roleText = (role || '').toUpperCase();
    const adminDesc = 'Can view, create, edit tasks, project and manage settings.';
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
          .link-section { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .link-section p { margin: 5px 0; }
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
            ${roleText === 'ADMIN' ? `<p style="margin:10px 0;">${adminDesc}</p>` : ''}
            <p>Click the button below to accept your invitation and get started:</p>
            <a href="${acceptLink}" class="button">Accept Invitation</a>
            <div class="link-section">
              <p><strong>Or copy this link:</strong></p>
              <p style="word-break: break-all; color: #1976d2;">${acceptLink}</p>
            </div>
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

  async sendWorkItemNotification(
    email: string,
    firstName: string,
    action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned',
    payload: { title: string; type: string; status?: string; priority?: string },
  ): Promise<void> {
    const subjectMap = {
      created: 'New Work Item Assigned',
      updated: 'Work Item Updated',
      deleted: 'Work Item Deleted',
      status_changed: 'Work Item Status Changed',
      assigned: 'You have been assigned a Work Item',
    };
    const subject = subjectMap[action] || 'Work Item Notification';
    const html = this.getWorkItemTemplate(firstName, action, payload);
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject,
        html,
      });
      this.logger.log(`Work item ${action} email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send work item ${action} email to ${email}`, error.stack);
    }
  }

  private getWorkItemTemplate(
    firstName: string,
    action: string,
    payload: { title: string; type: string; status?: string; priority?: string },
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Work Item Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">PM Tool</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0;">Hello ${firstName},</h2>
          <p>A work item has been ${action}.</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Title:</strong> ${payload.title}</li>
            <li><strong>Type:</strong> ${payload.type}</li>
            ${payload.status ? `<li><strong>Status:</strong> ${payload.status}</li>` : ''}
            ${payload.priority ? `<li><strong>Priority:</strong> ${payload.priority}</li>` : ''}
          </ul>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  async sendAttachmentNotification(
    email: string,
    firstName: string,
    action: 'uploaded' | 'deleted',
    payload: { fileName: string; workItemTitle?: string },
  ): Promise<void> {
    const subject = action === 'uploaded' ? 'New Attachment Added' : 'Attachment Removed';
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Attachment Notification</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">PM Tool</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0;">Hello ${firstName},</h2>
          <p>An attachment has been ${action}.</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>File:</strong> ${payload.fileName}</li>
            ${payload.workItemTitle ? `<li><strong>Work Item:</strong> ${payload.workItemTitle}</li>` : ''}
          </ul>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject,
        html,
      });
      this.logger.log(`Attachment ${action} email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send attachment ${action} email to ${email}`, error.stack);
    }
  }

  async sendCommentNotification(
    email: string,
    firstName: string,
    payload: { workItemTitle?: string; preview: string },
  ): Promise<void> {
    const subject = 'New Comment Added';
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Comment Notification</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">PM Tool</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0;">Hello ${firstName},</h2>
          <p>A new comment has been added.</p>
          ${payload.workItemTitle ? `<p><strong>Work Item:</strong> ${payload.workItemTitle}</p>` : ''}
          <blockquote style="background:#fff; border-left:4px solid #2563eb; margin:20px 0; padding:10px 15px;">${payload.preview}</blockquote>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} PM Tool. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject,
        html,
      });
      this.logger.log(`Comment notification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send comment notification email to ${email}`, error.stack);
    }
  }
}
