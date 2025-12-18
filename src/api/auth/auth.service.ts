import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { ChangePasswordDto } from 'src/dto/change-password.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private cfg: ConfigService,
    private readonly emailQueueService: EmailQueueService,
    private readonly i18n: I18nService,
  ) {
    this.saltRounds = Number(this.cfg.get('BCRYPT_SALT_ROUNDS') ?? 12);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user)
      throw new UnprocessableEntityException({
        message: this.i18n.t(
          this.i18n.t('common.errors.auth.invalid_credentials'),
        ),
        errors: {
          password: [this.i18n.t('common.errors.auth.invalid_credentials')],
        },
      });

    if (user.is_active === false) {
      throw new BadRequestException({
        message: this.i18n.t('common.errors.auth.account_inactive'),
        errors: {
          password: [
            this.i18n.t('common.errors.auth.your_account_is_inactive'),
          ],
        },
      });
    }

    const ok = await bcrypt.compare(password, (user as any).password);
    if (!ok)
      throw new UnprocessableEntityException({
        message: this.i18n.t('common.errors.auth.invalid_credentials'),
        errors: {
          password: [this.i18n.t('common.errors.auth.invalid_credentials')],
        },
      });

    await user.populate('organization', 'name');
    await user.populate('roles', 'name permissions')

    return user;
  }

  async signAccessToken(user: { _id: any; email: string; user_type: string, organization: any }) {
    const payload = {
      _id: String(user._id),
      email: user.email,
      user_type: user.user_type,
      organization_id: user.organization?._id ? String(user.organization._id) : null,
    };
    return this.jwt.signAsync(payload);
  }

  async createResetToken(email: string) {
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(raw, this.saltRounds);

    const minutes = Number(this.cfg.get('RESET_TOKEN_EXP_MIN') ?? 60);
    const expires = new Date(Date.now() + minutes * 60 * 1000); // 1 hour

    await this.usersService.setResetToken(email, hash, expires);

    return { raw, expires };
  }

  async resetPasswordByToken(token: string, newPassword: string) {
    await this.usersService.consumeResetToken(token, newPassword);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.getByEmail(email);

    if (user) {
      const { raw, expires } = await this.createResetToken(email).catch(() => ({
        raw: null,
        expires: null,
      }));

      // TODO: send email. For now return a link for testing.
      if (raw) {
        const frontend = this.cfg.get<string>('FRONTEND_URL');
        const url = `${frontend}/reset-password?token=${raw}`;

        await this.emailQueueService.queueEmail(
          user.email,
          `${this.cfg.get<string>('APP_NAME')} - Your Password Reset Link`,
          './base',
          {
            title: 'Reset Your Password',
            subtitle: `Hi, ${user.first_name} ${user.last_name}`,
            para: `We received a request to reset your password. Click the button below to proceed:`,
            para2: `This link will expire in ${this.cfg.get<number>('RESET_TOKEN_EXP_MIN')} minutes.`,
            url,
            buttonCaption: 'Reset Password',
          },
        );

        return {
          message: this.i18n.t('common.errors.auth.password_reset_link_sent'),
          // reset_link: url,
          // expires_at: expires
        };
      }
    }

    return { message: this.i18n.t('common.errors.auth.reset_link_created') };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.getById(userId);
    console.log('Fetched user for password change',user);

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('common.errors.auth.user_not_found'),
      );
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException(
        this.i18n.t('common.errors.auth.current_password_incorrect'),
      );
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    console.log('Updating password for user:', userId, 'hashed:', hashed);

    await this.usersService.updatePassword(userId, hashed);

    return {
      message: this.i18n.t('common.errors.auth.password_changed_successfully'),
    };
  }
}
