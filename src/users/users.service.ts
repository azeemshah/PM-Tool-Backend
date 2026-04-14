import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if user exists
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findByEmailWithoutPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const normalizedEmail = updateUserDto.email?.trim().toLowerCase();

    // If email is being updated, check if it's already taken
    if (normalizedEmail) {
      const existingUser = await this.userModel.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
    }

    const payload: UpdateUserDto = {
      ...updateUserDto,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
    };

    const user = await this.userModel
      .findByIdAndUpdate(id, payload, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = newPassword;
    await user.save();
  }

  async setRefreshToken(id: string, token: string, expires: Date): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      { refreshToken: token, refreshTokenExpires: expires },
    );
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { refreshToken: null, refreshTokenExpires: null });
  }

  async findByRefreshToken(token: string) {
    return this.userModel
      .findOne({ refreshToken: token, refreshTokenExpires: { $gt: Date.now() } })
      .select('+password')
      .exec();
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    await this.userModel.updateOne(
      { email },
      {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    );
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      })
      .select('+password')
      .exec();
  }

  async findByVerificationToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ emailVerificationToken: token }).exec();
  }

  async markEmailAsVerified(id: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    );
  }

  async setEmailVerificationToken(id: string, token: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { emailVerificationToken: token });
  }

  async setOtp(id: string, otp: string, expires: Date): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { otp, otpExpires: expires });
  }

  async clearOtp(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { otp: null, otpExpires: null });
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    );
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { lastLoginAt: new Date() });
  }

  serializeUser(user: UserDocument): UserResponseDto {
    return plainToClass(UserResponseDto, user.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
