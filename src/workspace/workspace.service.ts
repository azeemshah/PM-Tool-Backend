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
import { getPermissionsForRole, getRoleId } from '../common/config/roles.config';
import { KanbanBoard } from '../kanban/board/schemas/kanban-board.schema';
import { KanbanColumn } from '../kanban/column/schemas/column.schema';
import { Item } from '@/work-items/schemas/work-item.schema';

import { NotificationService } from '../kanban/notification/notification.service';
import { NotificationType } from '../kanban/notification/schemas/notification.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel('Member') private memberModel: Model<any>,
    @InjectModel(Item.name) private workItemModel: Model<Item>,
    @InjectModel(KanbanBoard.name) private boardModel: Model<KanbanBoard>,
    @InjectModel(KanbanColumn.name) private columnModel: Model<KanbanColumn>,
    @InjectModel('Comment') private commentModel: Model<any>,
    @InjectModel('Attachment') private attachmentModel: Model<any>,
    @InjectModel('Notification') private notificationModel: Model<any>,
    @InjectModel('SavedFilter') private savedFilterModel: Model<any>,
    @InjectModel('Sprint') private sprintModel: Model<any>,
    private notificationService: NotificationService,
    private usersService: UsersService,
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
        const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done', 'Closed'];
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
          this.enrichMemberWithPermissions(member),
        );

        const workspaceObj = workspace.toObject ? workspace.toObject() : workspace;
        workspaceObj.members = enrichedMembers;
        return workspaceObj;
      }),
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

    console.log(
      `[findById] Workspace ${workspaceId}: found, members count=${workspace.members.length}`,
    );

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
      console.log(
        `[findById] Enriched member: userId=${enriched.userId._id}, role=${enriched.role.name}, permissions=${enriched.role.permissions.length}`,
      );
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
    userId?: string,
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

    // Notify members about update
    try {
      // Get actor details
      let actorName = 'Someone';
      if (userId) {
          try {
              const actor = await this.usersService.findOne(userId);
              if (actor) {
                  actorName = `${actor.firstName} ${actor.lastName}`;
              }
          } catch (e) {
              console.error('Failed to fetch actor details', e);
          }
      }

      const memberIds = workspace.members.map((m: any) => m.userId ? m.userId._id.toString() : m.toString());
      const ownerId = workspace.OwnedBy?._id?.toString() || workspace.OwnedBy?.toString();
      const allIds = new Set([...memberIds, ownerId].filter(Boolean));
      
      // const recipients = Array.from(allIds).filter(id => id !== userId);
      // User requested to receive notifications for their own actions as well
      const recipients = Array.from(allIds);

      for (const recipientId of recipients) {
        await this.notificationService.create({
            recipient: new Types.ObjectId(recipientId),
            sender: userId ? new Types.ObjectId(userId) : undefined,
            type: NotificationType.WORKSPACE_UPDATED,
            message: recipientId.toString() === userId
              ? `You updated workspace "${workspace.name}"`
              : `${actorName} updated workspace "${workspace.name}"`,
            workspace: workspace._id,
        });
      }
    } catch (err) {
      console.error('Failed to notify members about workspace update:', err);
    }

    return workspace;
  }

  async delete(workspaceId: string): Promise<void> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Notify members about deletion before deleting
    try {
      const memberIds = workspace.members.map((m: any) => m.toString());
      const ownerId = workspace.OwnedBy?.toString();
      const allIds = new Set([...memberIds, ownerId].filter(Boolean));

      for (const recipientId of allIds) {
        await this.notificationService.create({
            recipient: new Types.ObjectId(recipientId),
            type: NotificationType.WORKSPACE_DELETED,
            message: `Workspace "${workspace.name}" was deleted`,
            // workspace: workspace._id, // Cannot link to deleted workspace
        });
      }
    } catch (err) {
      console.error('Failed to notify members about workspace deletion:', err);
    }

    // 1. Delete all WorkItems in the workspace
    // We first find them to delete their related data (Comments, Attachments, etc.)
    const workItems = await this.workItemModel.find({ workspace: workspaceId });
    const workItemIds = workItems.map((item) => item._id);

    if (workItemIds.length > 0) {
      // Delete related data for these work items
      await this.commentModel.deleteMany({ workItem: { $in: workItemIds } });
      await this.attachmentModel.deleteMany({ workItem: { $in: workItemIds } });

      // Delete the work items themselves
      await this.workItemModel.deleteMany({ workspace: workspaceId });
    }

    // 2. Delete all Members of the workspace
    await this.memberModel.deleteMany({ workspaceId: workspaceId });

    // 3. Delete Saved Filters
    await this.savedFilterModel.deleteMany({ workspace: workspaceId });

    // 4. Delete Notifications related to the workspace
    await this.notificationModel.deleteMany({ workspace: workspaceId });

    // 5. Delete Sprints
    await this.sprintModel.deleteMany({ workspaceId: workspaceId });

    // 6. Delete Kanban Boards and their Columns
    const boards = await this.boardModel.find({ workspaceId: workspaceId });
    const boardIds = boards.map((b) => b._id);

    if (boardIds.length > 0) {
      // Delete Columns associated with these boards
      await this.columnModel.deleteMany({ BoardId: { $in: boardIds } });
      // Delete the Boards
      await this.boardModel.deleteMany({ workspaceId: workspaceId });
    }

    // 7. Finally, delete the Workspace
    await this.workspaceModel.deleteOne({ _id: workspaceId });
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

    const workspaceObjectId = new Types.ObjectId(workspaceId);

    try {
      const baseFilter = {
        workspace: workspaceId,
        type: { $ne: 'epic' },
      };

      const totalTasks = await this.workItemModel.countDocuments(baseFilter).exec();

      const completedTasks = await this.workItemModel
        .countDocuments({
          ...baseFilter,
          status: 'Done', // ItemStatus.DONE
        })
        .exec();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueTasks = await this.workItemModel
        .countDocuments({
          ...baseFilter,
          dueDate: { $lt: today },
          status: { $ne: 'Done' },
        })
        .exec();

      return {
        totalTasks,
        completedTasks,
        overdueTasks,
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
      };
    }
  }
}
