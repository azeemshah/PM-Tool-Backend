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
      OwneredBy: new Types.ObjectId(userId),
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
      .populate('OwneredBy', '-password')
      .populate('members', '-password')
      .exec();
  }

  async findById(workspaceId: string): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('OwneredBy', '-password')
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
      .populate('OwneredBy', '-password')
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

  async addMember(workspaceId: string, userId: string): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (workspace.members.includes(userObjectId)) {
      throw new ConflictException('User is already a member of this workspace');
    }

    workspace.members.push(userObjectId);
    return workspace.save();
  }

  async removeMember(workspaceId: string, userId: string): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    workspace.members = workspace.members.filter(
      (memberId) => memberId.toString() !== userObjectId.toString(),
    );

    return workspace.save();
  }

  async getMembers(workspaceId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel.findById(workspaceId).exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Return full member documents (so frontend gets role and populated user info)
    const members = await this.memberModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('userId', 'name email profilePicture')
      .sort({ joinedAt: -1 })
      .exec();

    return members;
  }
}
