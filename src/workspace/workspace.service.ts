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
import { WorkItem } from '../kanban/work-item/schemas/work-item.schema';
import { getPermissionsForRole, getRoleId } from '../common/config/roles.config';
import { KanbanBoard } from '../kanban/board/schemas/kanban-board.schema';
import { KanbanColumn } from '../kanban/column/schemas/column.schema';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel('Member') private memberModel: Model<any>,
    @InjectModel(WorkItem.name) private workItemModel: Model<WorkItem>,
    @InjectModel(KanbanBoard.name) private boardModel: Model<KanbanBoard>,
    @InjectModel(KanbanColumn.name) private columnModel: Model<KanbanColumn>,
  ) {}

  /**
   * Enrich member object with role permissions
   */
  private enrichMemberWithPermissions(member: any) {
    const obj = member.toObject ? member.toObject() : member;
    const permissions = getPermissionsForRole(obj.role);
    const roleId = getRoleId(obj.role);
    
    return {
      ...obj,
      role: {
        _id: roleId,
        name: obj.role,
        permissions,
      },
    };
  }

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

    // Create default Kanban board if boardType is 'kanban'
    if (savedWorkspace.boardType === 'kanban') {
      try {
        const defaultBoard = new this.boardModel({
          name: savedWorkspace.name,
          description: `Default board for ${savedWorkspace.name}`,
          workspaceId: savedWorkspace._id,
        });
        const savedBoard = await defaultBoard.save();

        // Create default columns
        const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Done'];
        for (let i = 0; i < defaultColumns.length; i++) {
          const column = new this.columnModel({
            BoardId: savedBoard._id,
            name: defaultColumns[i],
            position: i,
          });
          await column.save();
        }

        console.log('Default Kanban board created for workspace:', savedWorkspace._id);
      } catch (error) {
        console.error('Failed to create default Kanban board:', error);
        // Don't fail workspace creation if board creation fails
      }
    }

    return savedWorkspace;
  }

  async findAll(userId: string): Promise<any[]> {
    const workspaces = await this.workspaceModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('OwnedBy', '-password')
      .populate('members', '-password')
      .exec();

    // Enrich each workspace with member data containing permissions
    return Promise.all(
      workspaces.map(async (workspace: any) => {
        // Fetch member documents with roles
        let memberDocuments = await this.memberModel
          .find({ workspaceId: workspace._id })
          .populate('userId', 'name email profilePicture firstName lastName')
          .exec();

        // If no member documents exist but workspace has members, create them
        if (memberDocuments.length === 0 && workspace.members.length > 0) {
          console.log('Creating missing member records for workspace:', workspace._id);
          for (const memberId of workspace.members) {
            try {
              const existingMember = await this.memberModel.findOne({
                userId: new Types.ObjectId(memberId),
                workspaceId: workspace._id,
              });
              
              if (!existingMember) {
                const newMember = new this.memberModel({
                  userId: new Types.ObjectId(memberId),
                  workspaceId: workspace._id,
                  role: memberId.toString() === workspace.createdBy.toString() ? 'Owner' : 'Member',
                });
                await newMember.save();
              }
            } catch (err) {
              console.error(`Failed to create member record for user ${memberId}:`, err);
            }
          }
          
          // Fetch again after creating missing records
          memberDocuments = await this.memberModel
            .find({ workspaceId: workspace._id })
            .populate('userId', 'name email profilePicture firstName lastName')
            .exec();
        }

        const enrichedMembers = memberDocuments.map((member: any) =>
          this.enrichMemberWithPermissions(member)
        );

        const workspaceObj = workspace.toObject ? workspace.toObject() : workspace;
        workspaceObj.members = enrichedMembers;
        return workspaceObj;
      })
    );
  }

  async findById(workspaceId: string): Promise<any> {
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

    console.log(`[findById] Workspace ${workspaceId}: found, members count=${workspace.members.length}`);

    // Fetch member documents with roles and enrich with permissions
    let memberDocuments = await this.memberModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('userId', 'name email profilePicture firstName lastName')
      .exec();

    console.log(`[findById] Member documents found: ${memberDocuments.length}`);

    // If no member documents exist but workspace has members, create them
    if (memberDocuments.length === 0 && workspace.members.length > 0) {
      console.log(`[findById] Creating missing member records for workspace: ${workspaceId}`);
      for (const userId of workspace.members) {
        try {
          const existingMember = await this.memberModel.findOne({
            userId: new Types.ObjectId(userId),
            workspaceId: new Types.ObjectId(workspaceId),
          });
          
          if (!existingMember) {
            const role = userId.toString() === workspace.OwnedBy.toString() ? 'Owner' : 'Member';
            console.log(`[findById] Creating member record: userId=${userId}, role=${role}`);
            const newMember = new this.memberModel({
              userId: new Types.ObjectId(userId),
              workspaceId: new Types.ObjectId(workspaceId),
              role: role,
            });
            await newMember.save();
            console.log(`[findById] Member record created successfully`);
          } else {
            console.log(`[findById] Member record already exists for userId=${userId}`);
          }
        } catch (err) {
          console.error(`[findById] Failed to create member record for user ${userId}:`, err);
        }
      }
      
      // Fetch again after creating missing records
      memberDocuments = await this.memberModel
        .find({ workspaceId: new Types.ObjectId(workspaceId) })
        .populate('userId', 'name email profilePicture firstName lastName')
        .exec();
      
      console.log(`[findById] After migration - Member documents count: ${memberDocuments.length}`);
    }

    // Enrich members with permissions
    const enrichedMembers = memberDocuments.map((member: any) => {
      const enriched = this.enrichMemberWithPermissions(member);
      console.log(`[findById] Enriched member: userId=${enriched.userId._id}, role=${enriched.role.name}, permissions=${enriched.role.permissions.length}`);
      return enriched;
    });

    console.log(`[findById] Total enriched members: ${enrichedMembers.length}`);

    // Replace workspace members array with enriched member documents
    const workspaceObj = workspace.toObject ? workspace.toObject() : workspace;
    workspaceObj.members = enrichedMembers;

    return workspaceObj;
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

    // Enrich members with permissions
    return members.map((member: any) => this.enrichMemberWithPermissions(member));
  }

  async getAnalytics(
    workspaceId: string,
  ): Promise<{ totalTasks: number; overdueTasks: number; completedTasks: number }> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Get all projects for this workspace
    // For now, we'll fetch all issues and count them
    // In a more advanced implementation, we could fetch projects first then issues per project

    try {
      // Count all tasks (type: 'task') in work items - simplified approach
      // Get all work items and filter by workspace
      const totalIssues = await this.workItemModel.countDocuments({}).exec();

      // Count completed work items (status: 'done')
      const completedIssues = await this.workItemModel.countDocuments({ status: 'done' }).exec();

      // Count overdue work items (dueDate < today and status !== 'done')
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const overdueIssues = await this.workItemModel
        .countDocuments({
          dueDate: { $lt: now },
          status: { $ne: 'done' },
        })
        .exec();

      return {
        totalTasks: totalIssues,
        overdueTasks: overdueIssues,
        completedTasks: completedIssues,
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return {
        totalTasks: 0,
        overdueTasks: 0,
        completedTasks: 0,
      };
    }
  }
}
