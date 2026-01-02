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

@Injectable()
export class WorkspaceService {
  constructor(@InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: string): Promise<WorkspaceDocument> {
    if (!createWorkspaceDto.name || createWorkspaceDto.name.trim() === '') {
      throw new BadRequestException('Workspace name is required');
    }

    const workspace = new this.workspaceModel({
      ...createWorkspaceDto,
      createdBy: new Types.ObjectId(userId),
      members: [new Types.ObjectId(userId)],
    });

    return workspace.save();
  }

  async findAll(userId: string): Promise<WorkspaceDocument[]> {
    return this.workspaceModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('createdBy', '-password')
      .populate('members', '-password')
      .exec();
  }

  async findById(workspaceId: string): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('createdBy', '-password')
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
      .populate('createdBy', '-password')
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

    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('members', '-password')
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace.members;
  }
}
