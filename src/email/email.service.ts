import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailQueue, EmailQueueDocument } from './schemas/email-queue.schema';

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly BATCH_SIZE = 10;
  private readonly CRON_EXPRESSION = '*/1 * * * *';
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly MIN_SEND_INTERVAL_MS = 1200;

  async sendTempPassword(email: string, tempPassword: string): Promise<void> {
    try {
      await this.enqueueEmail({
        to: email,
        subject: 'Your Temporary Password',
        html: this.getTempPasswordTemplate(tempPassword),
        context: {
          type: 'TEMP_PASSWORD',
        },
      });

      this.logger.log(`Temporary password email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue temporary password email for ${email}`, err.stack);
      throw error;
    }
  }

  async sendInvite(
    email: string,
    role: string,
    inviteLink: string,
    workspaceInviteCode?: string,
  ): Promise<void> {
    try {
      await this.enqueueEmail({
        to: email,
        subject: "You're Invited to Join PM Tool",
        html: this.getInviteEmailTemplate(role, inviteLink, workspaceInviteCode),
        context: {
          type: 'INVITE',
          role,
          inviteLink,
          workspaceInviteCode,
        },
      });
      this.logger.log(`Invitation email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue invitation email for ${email}`, err.stack);
      throw error;
    }
  }

  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private cronTask: cron.ScheduledTask | null = null;
  private isProcessingQueue = false;

  constructor(
    private configService: ConfigService,
    @InjectModel(EmailQueue.name)
    private readonly emailQueueModel: Model<EmailQueueDocument>,
  ) {
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

  onModuleInit(): void {
    this.startQueueProcessor();
  }

  onModuleDestroy(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.logger.log('Email queue cron stopped');
    }
  }

  private startQueueProcessor(): void {
    if (this.cronTask) {
      return;
    }

    this.cronTask = cron.schedule(this.CRON_EXPRESSION, async () => {
      await this.processEmailQueue();
    });

    this.logger.log(
      `Email queue cron started. Processing ${this.BATCH_SIZE} pending emails every 1 minute.`,
    );
  }

  private async enqueueEmail(data: {
    to: string;
    subject: string;
    html: string;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.emailQueueModel.create({
      to: data.to,
      subject: data.subject,
      html: data.html,
      context: data.context,
      status: 'PENDING',
      retryCount: 0,
    });
  }

  private async processEmailQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const pendingEmails = await this.emailQueueModel
        .find({ status: 'PENDING' })
        .sort({ createdAt: 1 })
        .limit(this.BATCH_SIZE)
        .exec();

      if (!pendingEmails.length) {
        return;
      }

      this.logger.log(`Processing email queue batch: ${pendingEmails.length} email(s)`);

      for (let i = 0; i < pendingEmails.length; i++) {
        const queueItem = pendingEmails[i];

        // Avoid hitting provider per-second limits by spacing emails.
        if (i > 0) {
          await this.sleep(this.MIN_SEND_INTERVAL_MS);
        }

        try {
          await this.transporter.sendMail({
            from: this.configService.get('EMAIL_FROM'),
            to: queueItem.to,
            subject: queueItem.subject,
            html: queueItem.html,
          });

          await this.emailQueueModel.findByIdAndDelete(queueItem._id).exec();
          this.logger.log(`Queued email sent to ${queueItem.to}`);
        } catch (error) {
          const err = error as Error & {
            code?: string;
            responseCode?: number;
            response?: string;
            command?: string;
          };
          const nextRetryCount = (queueItem.retryCount || 0) + 1;
          const failureReason = [
            err.message,
            err.code ? `code=${err.code}` : '',
            err.responseCode ? `responseCode=${err.responseCode}` : '',
            err.command ? `command=${err.command}` : '',
          ]
            .filter(Boolean)
            .join(' | ');

          if (this.isRateLimitError(err)) {
            await this.emailQueueModel
              .findByIdAndUpdate(queueItem._id, {
                status: 'PENDING',
                failedAt: new Date(),
                lastError: failureReason,
              })
              .exec();

            this.logger.warn(
              `Provider rate limit hit while sending to ${queueItem.to}. Keeping email in queue for next run. Reason: ${failureReason}`,
            );

            // Stop current batch to avoid repeating provider throttling errors.
            break;
          }

          if (nextRetryCount >= this.MAX_RETRY_ATTEMPTS) {
            await this.emailQueueModel.findByIdAndDelete(queueItem._id).exec();
            this.logger.error(
              `Email permanently failed after ${this.MAX_RETRY_ATTEMPTS} attempts and was removed from queue: ${queueItem.to}`,
              err.stack,
            );
            continue;
          }

          await this.emailQueueModel
            .findByIdAndUpdate(queueItem._id, {
              status: 'PENDING',
              retryCount: nextRetryCount,
              failedAt: new Date(),
              lastError: failureReason,
            })
            .exec();

          this.logger.warn(
            `Failed to send queued email to ${queueItem.to}. Retry ${nextRetryCount}/${this.MAX_RETRY_ATTEMPTS}. Reason: ${failureReason}`,
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error('Email queue processor failed', err.stack);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRateLimitError(error: {
    message?: string;
    code?: string;
    responseCode?: number;
    response?: string;
  }): boolean {
    const combined = `${error.message || ''} ${error.response || ''}`.toLowerCase();
    return (
      combined.includes('too many emails per second') ||
      combined.includes('rate limit') ||
      error.responseCode === 429
    );
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.enqueueEmail({
        to: email,
        subject: 'Welcome to PM Tool!',
        html: this.getWelcomeEmailTemplate(firstName),
        context: {
          type: 'WELCOME',
          firstName,
        },
      });
      this.logger.log(`Welcome email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue welcome email for ${email}`, err.stack);
    }
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationUrl: string,
  ): Promise<void> {
    try {
      await this.enqueueEmail({
        to: email,
        subject: 'Verify Your Email Address',
        html: this.getVerificationEmailTemplate(firstName, verificationUrl),
        context: {
          type: 'VERIFICATION',
          firstName,
          verificationUrl,
        },
      });
      this.logger.log(`Verification email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue verification email for ${email}`, err.stack);
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetUrl: string): Promise<void> {
    try {
      await this.enqueueEmail({
        to: email,
        subject: 'Reset Your Password',
        html: this.getPasswordResetTemplate(firstName, resetUrl),
        context: {
          type: 'PASSWORD_RESET',
          firstName,
          resetUrl,
        },
      });
      this.logger.log(`Password reset email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue password reset email for ${email}`, err.stack);
    }
  }

  async sendPasswordChangedEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.enqueueEmail({
        to: email,
        subject: 'Password Changed Successfully',
        html: this.getPasswordChangedTemplate(firstName),
        context: {
          type: 'PASSWORD_CHANGED',
          firstName,
        },
      });
      this.logger.log(`Password changed confirmation queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue password changed email for ${email}`, err.stack);
    }
  }

  async sendLoginOtp(email: string, firstName: string, otp: string): Promise<void> {
    try {
      await this.enqueueEmail({
        to: email,
        subject: 'Your Login OTP',
        html: this.getLoginOtpTemplate(firstName, otp),
        context: {
          type: 'LOGIN_OTP',
          firstName,
        },
      });
      this.logger.log(`Login OTP queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue login OTP for ${email}`, err.stack);
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
        await this.enqueueEmail({
          to: r.email,
          subject,
          html,
          context: {
            type: 'ACTIVITY',
            name: r.name,
          },
        });
        this.logger.log(`Activity email queued for ${r.email}`);
      } catch (error) {
        const err = error as Error;
        this.logger.error(`Failed to queue activity email for ${r.email}`, err.stack);
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

  private getTempPasswordTemplate(tempPassword: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Temporary Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">PM Tool</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0;">Your account is ready</h2>
          <p>Your temporary password is:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="background-color: #2563eb; color: white; padding: 12px 20px; font-size: 18px; font-weight: bold; letter-spacing: 1px; border-radius: 6px;">${tempPassword}</span>
          </div>
          <p>Please login and change your password immediately for security.</p>
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
      await this.enqueueEmail({
        to: email,
        subject,
        html,
        context: {
          type: 'WORK_ITEM',
          action,
          firstName,
        },
      });
      this.logger.log(`Work item ${action} email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue work item ${action} email for ${email}`, err.stack);
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
      await this.enqueueEmail({
        to: email,
        subject,
        html,
        context: {
          type: 'ATTACHMENT',
          action,
          firstName,
        },
      });
      this.logger.log(`Attachment ${action} email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue attachment ${action} email for ${email}`, err.stack);
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
      await this.enqueueEmail({
        to: email,
        subject,
        html,
        context: {
          type: 'COMMENT',
          firstName,
        },
      });
      this.logger.log(`Comment notification email queued for ${email}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to queue comment notification email for ${email}`, err.stack);
    }
  }
}
