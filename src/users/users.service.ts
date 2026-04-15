import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToClass } from 'class-transformer';
import { Item } from '@/work-items/schemas/work-item.schema';
import { KanbanBoard } from '../kanban/board/schemas/kanban-board.schema';
import { KanbanColumn } from '../kanban/column/schemas/column.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('Member') private memberModel: Model<any>,
    @InjectModel('Workspace') private workspaceModel: Model<any>,
    @InjectModel(Item.name) private workItemModel: Model<Item>,
    @InjectModel(KanbanBoard.name) private boardModel: Model<KanbanBoard>,
    @InjectModel(KanbanColumn.name) private columnModel: Model<KanbanColumn>,
    @InjectModel('Comment') private commentModel: Model<any>,
    @InjectModel('Attachment') private attachmentModel: Model<any>,
    @InjectModel('Notification') private notificationModel: Model<any>,
    @InjectModel('SavedFilter') private savedFilterModel: Model<any>,
    @InjectModel('Sprint') private sprintModel: Model<any>,
  ) {}

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

  async deleteAccount(userId: string, deleteOwnedWorkspaces = false): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userObjectId = new Types.ObjectId(userId);

    const ownedWorkspaces = await this.workspaceModel.find({ OwnedBy: userObjectId }).select('_id');
    if (ownedWorkspaces.length > 0 && !deleteOwnedWorkspaces) {
      throw new ConflictException(
        'You own one or more workspaces. Select delete all owned workspaces to continue.',
      );
    }

    if (ownedWorkspaces.length > 0 && deleteOwnedWorkspaces) {
      const ownedWorkspaceIds = ownedWorkspaces.map((workspace) => workspace._id.toString());

      const workItems = await this.workItemModel.find({ workspace: { $in: ownedWorkspaceIds } });
      const workItemIds = workItems.map((item: any) => item._id);

      if (workItemIds.length > 0) {
        await this.commentModel.deleteMany({ workItem: { $in: workItemIds } });
        await this.attachmentModel.deleteMany({ workItem: { $in: workItemIds } });
        await this.workItemModel.deleteMany({ workspace: { $in: ownedWorkspaceIds } });
      }

      await this.memberModel.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } });
      await this.savedFilterModel.deleteMany({ workspace: { $in: ownedWorkspaceIds } });
      await this.notificationModel.deleteMany({ workspace: { $in: ownedWorkspaceIds } });
      await this.sprintModel.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } });

      const boards = await this.boardModel.find({ workspaceId: { $in: ownedWorkspaceIds } });
      const boardIds = boards.map((board: any) => board._id);
      if (boardIds.length > 0) {
        await this.columnModel.deleteMany({ BoardId: { $in: boardIds } });
      }
      await this.boardModel.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } });
      await this.workspaceModel.deleteMany({ _id: { $in: ownedWorkspaceIds } });
    }

    // Remove user from workspace members arrays before deleting account.
    await this.workspaceModel.updateMany({ members: userObjectId }, { $pull: { members: userObjectId } });

    // Remove explicit membership records.
    await this.memberModel.deleteMany({ userId: userObjectId });

    await this.userModel.deleteOne({ _id: userObjectId });
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
