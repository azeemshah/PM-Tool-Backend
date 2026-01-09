import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { plainToClass } from 'class-transformer';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel('Member') private memberModel: Model<any>,
  ) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: string): Promise<WorkspaceDocument> {
    if (!createWorkspaceDto.name || createWorkspaceDto.name.trim() === '') {
      throw new BadRequestException('Workspace name is required');
    }

    // Generate unique invite code
    const inviteCode = uuidv4().split('-')[0];

    const workspace = new this.workspaceModel({
      ...createWorkspaceDto,
      OwnedBy: new Types.ObjectId(userId),
      members: [new Types.ObjectId(userId)],
      inviteCode,
    });

    const savedWorkspace = await workspace.save();

    // Create owner member record
    try {
      const ownerMember = new this.memberModel({
        userId: new Types.ObjectId(userId),
        workspaceId: savedWorkspace._id,
        role: 'Owner',
      });
      await ownerMember.save();
    } catch (error) {
      console.error('Failed to create owner member record:', error);
      // Don't fail workspace creation if member creation fails
    }

    return savedWorkspace;
  }

  async findAll(userId: string): Promise<WorkspaceDocument[]> {
    return this.workspaceModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('OwnedBy', '-password')
      .populate('members', '-password')
      .exec();
  }

  async findById(workspaceId: string): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('OwnedBy', '-password')
      .populate('members', '-password')
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel
      .findByIdAndUpdate(workspaceId, updateWorkspaceDto, { new: true })
      .populate('OwnedBy', '-password')
      .populate('members', '-password')
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async delete(workspaceId: string): Promise<void> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const result = await this.workspaceModel.deleteOne({ _id: workspaceId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Workspace not found');
    }
  }
}
