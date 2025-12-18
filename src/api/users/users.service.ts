import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from 'src/schema/user.schema';
import { UpdateProfileDto } from 'src/dto/update-profile.dto';
import { getAvatarUrl } from 'src/helpers';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';


@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private cfg: ConfigService,
    private jwt: JwtService,
  ) {
    this.saltRounds = Number(this.cfg.get('BCRYPT_SALT_ROUNDS') ?? 12);
  }

  async createUser(
    organizationId: Types.ObjectId,
    createUserDto: CreateUserDto,
  ): Promise<User> {
    const exists = await this.userModel.exists({
      email: createUserDto.email.toLowerCase(),
    });
    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const hash = await bcrypt.hash(createUserDto.password, this.saltRounds);
    const userDoc = new this.userModel({
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
      email: createUserDto.email.toLowerCase(),
      password: hash,
      contact_number: createUserDto.contact_number ?? null,
      avatar: createUserDto.avatar ?? null,
      user_type: 'user',
      organization: organizationId,
      is_active: true,
      roles: createUserDto.roles,
    });

    const saved = await userDoc.save();

    const user: any = saved.toObject();
    delete user.password;

    return user;
  }



  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');
  }

  async getById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('+password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email: email.toLowerCase() });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: dto.email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (dto.avatar === null) {
      delete dto.avatar;
    }

    Object.assign(user, dto);

    await user.save();

    await user.populate({
      path: 'organization',
      select: 'name',
      model: 'Organization',
    });

    const access_token = await this.jwt.signAsync({
      _id: String(user._id),
      email: user.email,
      user_type: user.user_type,
    });

    return {
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_number: user.contact_number,
        avatar_url: getAvatarUrl(user),
        user_type: user.user_type,
        organization: user.organization,
        is_active: user.is_active,
      },
      access_token,
    };
  }

  async setResetToken(
    email: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          reset_password_token: tokenHash,
          reset_password_expires: expiresAt,
        },
      },
    );
  }

  async consumeResetToken(token: string, newPassword: string): Promise<void> {
    // We store a hash, so we must find candidates and compare
    const candidates = await this.userModel
      .find({
        reset_password_expires: { $gt: new Date() },
      })
      .select('+reset_password_token +reset_password_expires');

    for (const u of candidates) {
      const ok = await bcrypt.compare(
        token,
        (u as any).reset_password_token ?? '',
      );
      if (ok) {
        const hash = await bcrypt.hash(newPassword, this.saltRounds);
        await this.userModel.updateOne(
          { _id: u._id },
          {
            $set: { password: hash },
            $unset: { reset_password_token: '', reset_password_expires: '' },
          },
        );
        return;
      }
    }
    throw new UnprocessableEntityException('Invalid or expired reset token');
  }

  async updatePassword(
    userId: string,
    newHashedPassword: string,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { password: newHashedPassword } },
    );
  }


  async list(orgId: Types.ObjectId, page = 1, limit = 10, search?: string) {
    const query: any = {
      organization: orgId,
    };

    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact_number: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const projection = 'first_name last_name email contact_number roles is_active createdAt';


    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("roles", "_id name")
        .select(projection),
      this.userModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        throw new BadRequestException({
          "message": "Validation failed",
          "errors": {
            "email": [
              "Email address already exists."
            ]
          }
        });
      }
    }

    Object.assign(user, updateUserDto);

    await user.save();
    return user;
  }

  async toggle(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.is_active === true) {
      user.is_active = false;
    } else {
      user.is_active = true;
    }

    Object.assign(user);

    await user.save();
    return user;

  }
}
