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

      } catch (error) {
        console.error('Failed to create default Kanban board:', error);
        // Don't fail workspace creation if board creation fails
      }
    }

    // Create default Sprint if boardType is 'scrumboard'
    if (savedWorkspace.boardType === 'scrumboard') {
      try {
        const now = new Date();
        const startDate = now;
        const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now

        // Create default sprint and save it as a board in KanbanBoard collection
        const defaultBoard = new this.boardModel({
          name: 'Sprint 1',
          description: `Initial sprint for ${savedWorkspace.name}`,
          workspaceId: savedWorkspace._id,
        });
        const savedBoard = await defaultBoard.save();

        // Create default columns for the sprint board
        const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done', 'Closed'];
        for (let i = 0; i < defaultColumns.length; i++) {
          const column = new this.columnModel({
            BoardId: savedBoard._id,
            name: defaultColumns[i],
            position: i,
          });
          await column.save();
        }

        // Also create the sprint document with reference to the board
        const defaultSprint = new this.sprintModel({
          workspaceId: savedWorkspace._id,
          name: 'Sprint 1',
          goal: `Initial sprint for ${savedWorkspace.name}`,
          startDate,
          endDate,
          status: 'PLANNED',
          workItems: [],
          columns: ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done', 'Closed'],
        });
        await defaultSprint.save();

      } catch (error) {
        console.error('Failed to create default Sprint board:', error);
        // Don't fail workspace creation if sprint creation fails
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

    // Fetch member documents with roles and enrich with permissions
    let memberDocuments = await this.memberModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('userId', 'name email profilePicture firstName lastName')
      .exec();

    // If no member documents exist but workspace has members, create them
    if (memberDocuments.length === 0 && workspace.members.length > 0) {
      for (const userId of workspace.members) {
        try {
          const existingMember = await this.memberModel.findOne({
            userId: new Types.ObjectId(userId),
            workspaceId: new Types.ObjectId(workspaceId),
          });

          if (!existingMember) {
            const role = userId.toString() === workspace.OwnedBy.toString() ? 'Owner' : 'Member';
            const newMember = new this.memberModel({
              userId: new Types.ObjectId(userId),
              workspaceId: new Types.ObjectId(workspaceId),
              role: role,
            });
            await newMember.save();
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
    }

    // Enrich members with permissions
    const enrichedMembers = memberDocuments.map((member: any) => {
      return this.enrichMemberWithPermissions(member);
    });

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

      const memberIds = workspace.members.map((m: any) =>
        m.userId ? m.userId._id.toString() : m.toString(),
      );
      const ownerId = workspace.OwnedBy?._id?.toString() || workspace.OwnedBy?.toString();
      const allIds = new Set([...memberIds, ownerId].filter(Boolean));
      const recipients = Array.from(allIds).filter((id) => id !== userId);

      for (const recipientId of recipients) {
        await this.notificationService.create({
          recipient: new Types.ObjectId(recipientId),
          sender: userId ? new Types.ObjectId(userId) : undefined,
          type: NotificationType.WORKSPACE_UPDATED,
          message:
            recipientId.toString() === userId
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

  async delete(workspaceId: string, actorId?: string): Promise<void> {
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
        if (actorId && recipientId === actorId) continue;

        await this.notificationService.create({
          recipient: new Types.ObjectId(recipientId),
          type: NotificationType.WORKSPACE_DELETED,
          message: `Workspace "${workspace.name}" was deleted`,
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
    timeframe?: string,
  ): Promise<{
    totalTasks: number;
    overdueTasks: number;
    completedTasks: number;
    remainingTasks: number;
    remainingPoints: number;
    remainingHours: number;
  }> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    try {
      const baseFilter: any = {
        workspace: workspaceId,
        type: { $ne: 'epic' },
      };

      // Apply timeframe filtering if provided
      const now = new Date();
      if (timeframe) {
        const startDate = new Date();
        if (timeframe === 'today') {
          startDate.setHours(0, 0, 0, 0);
          baseFilter.createdAt = { $gte: startDate };
        } else if (timeframe === 'weekly') {
          startDate.setDate(now.getDate() - 7);
          baseFilter.createdAt = { $gte: startDate };
        } else if (timeframe === 'monthly') {
          // Show data for the current year to display months
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          baseFilter.createdAt = { $gte: startDate };
        } else if (timeframe === 'yearly') {
          // Show data for the last 5 years to display multiple years
          startDate.setFullYear(now.getFullYear() - 5);
          baseFilter.createdAt = { $gte: startDate };
        }
      }

      const allTasks = await this.workItemModel.find(baseFilter).exec();

      const completedStatuses = ['Done', 'Closed'];
      const remainingStatuses = ['To Do', 'In Progress', 'In Review', 'Blocked'];

      const totalTasks = allTasks.length;

      const completedTasks = allTasks.filter((t) => completedStatuses.includes(t.status)).length;

      const remainingTasksItems = allTasks.filter((t) => !completedStatuses.includes(t.status));

      const remainingTasks = remainingTasksItems.length;

      const remainingPoints = remainingTasksItems.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      const remainingHours = remainingTasksItems.reduce(
        (sum, t) => sum + (t.remainingEstimate || 0) / 60,
        0, // converting minutes to hours if it's in minutes
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueTasks = allTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < today && !completedStatuses.includes(t.status),
      ).length;

      return {
        totalTasks,
        completedTasks,
        overdueTasks,
        remainingTasks,
        remainingPoints,
        remainingHours,
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        remainingTasks: 0,
        remainingPoints: 0,
        remainingHours: 0,
      };
    }
  }

  async getVelocityAnalytics(workspaceId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    try {
      const sprints = await this.sprintModel
        .find({ workspaceId: new Types.ObjectId(workspaceId) })
        .populate('workItems')
        .sort({ createdAt: 1 })
        .limit(6) // Limit to last 6 sprints for chart
        .exec();

      const completedStatuses = ['Done', 'Completed', 'Closed', 'Finished'];

      const matchStatus = (itemStatus: string, targets: string[]) => {
        if (!itemStatus) return false;
        const normalized = itemStatus.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
        return targets.some(
          (t) => t.toLowerCase().replace(/\s+/g, '').replace(/-/g, '') === normalized,
        );
      };

      const calculatePointsOrCount = (items: any[]) => {
        let total = 0;
        let hasEstimates = false;

        for (const item of items) {
          const storyPoints = typeof item.storyPoints === 'number' ? item.storyPoints : 0;
          const originalEstimate =
            typeof item.originalEstimate === 'number' ? item.originalEstimate : 0;

          if (storyPoints > 0) {
            total += storyPoints;
            hasEstimates = true;
          } else if (originalEstimate > 0) {
            total += originalEstimate / 60;
            hasEstimates = true;
          }
        }

        if (!hasEstimates) {
          return items.length;
        }

        return total;
      };

      return sprints.map((sprint) => {
        const items = sprint.workItems || [];

        const committedPoints = calculatePointsOrCount(items);

        const completedItems = items.filter((item) => matchStatus(item.status, completedStatuses));
        let completedPoints = calculatePointsOrCount(completedItems);

        const sprintStatus = (sprint.status || '').toString().toLowerCase();
        const isCompletedSprint = ['completed', 'done', 'closed'].includes(sprintStatus);

        if (isCompletedSprint) {
          if (completedPoints === 0 && committedPoints > 0) {
            completedPoints = committedPoints;
          } else if (completedPoints === 0 && committedPoints === 0) {
            completedPoints = 1;
          }
        }

        return {
          name: sprint.name,
          committed: Math.round(committedPoints),
          completed: Math.round(completedPoints),
        };
      });
    } catch (error) {
      console.error('Error calculating velocity:', error);
      return [];
    }
  }

  async getCFDAnalytics(workspaceId: string, timeframe: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    try {
      const workspaceObjectId = new Types.ObjectId(workspaceId);

      // Use a more robust query to catch items using different workspace field names
      const items = await this.workItemModel
        .find({
          $or: [
            { workspace: workspaceObjectId },
            { spaceid: workspaceObjectId },
            { workspace: workspaceId },
            { spaceid: workspaceId },
            { workspaceId: workspaceId },
          ],
        })
        .select('status createdAt updatedAt')
        .exec();

      const analyticsData: any[] = [];
      const now = new Date();
      const startDate = new Date();
      let intervalDays = 1;
      let totalPoints = 10;

      switch (timeframe) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          intervalDays = 1 / 24;
          totalPoints = 24;
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 7);
          intervalDays = 1;
          totalPoints = 7;
          break;
        case 'monthly':
          startDate.setDate(now.getDate() - 30);
          intervalDays = 3;
          totalPoints = 10;
          break;
        case 'yearly':
        default:
          startDate.setFullYear(now.getFullYear() - 1);
          intervalDays = 30;
          totalPoints = 12;
          break;
      }

      const matchStatus = (itemStatus: string, targets: string[]) => {
        if (!itemStatus) return false;
        const normalized = itemStatus.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
        return targets.some(
          (t) => t.toLowerCase().replace(/\s+/g, '').replace(/-/g, '') === normalized,
        );
      };

      const statusGroups: Record<string, string[]> = {
        Backlog: ['Backlog'],
        'To Do': ['To Do', 'ToDo', 'Todo', 'Open', 'New'],
        'In Progress': ['In Progress', 'InProgress', 'Active', 'Doing'],
        'In Review': ['In Review', 'InReview', 'Review', 'Under Review'],
        Blocked: ['Blocked'],
        Done: ['Done', 'Completed', 'Finished'],
        Closed: ['Closed'],
      };

      const allItemStatuses = new Set<string>();
      for (const item of items) {
        const status = (item.status || '').toString();
        if (status) {
          allItemStatuses.add(status);
        }
      }

      for (const rawStatus of allItemStatuses) {
        const isCovered = Object.values(statusGroups).some((targets) =>
          matchStatus(rawStatus, targets),
        );
        if (!isCovered) {
          statusGroups[rawStatus] = [rawStatus];
        }
      }

      const preferredOrder = [
        'Backlog',
        'To Do',
        'In Progress',
        'In Review',
        'Blocked',
        'Done',
        'Closed',
      ];

      const dynamicStatuses = Object.keys(statusGroups).sort((a, b) => {
        const ai = preferredOrder.indexOf(a);
        const bi = preferredOrder.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

      for (let i = 0; i <= totalPoints; i++) {
        const pointDate = new Date(startDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);

        const itemsAtPoint = items.filter((item) => {
          const created = new Date(item.createdAt);
          return created <= pointDate;
        });

        const dataPoint: any = {
          name: this.formatDateLabel(pointDate, timeframe),
          timestamp: pointDate.getTime(),
        };

        for (const status of dynamicStatuses) {
          const targets = statusGroups[status] || [status];
          const count = itemsAtPoint.filter((item) => matchStatus(item.status, targets)).length;
          dataPoint[status] = count;
        }

        analyticsData.push(dataPoint);
      }

      return analyticsData;
    } catch (error) {
      console.error('Error calculating CFD:', error);
      return [];
    }
  }

  private formatDateLabel(date: Date, timeframe: string): string {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    switch (timeframe) {
      case 'today':
        return `${date.getHours()}:00`;
      case 'weekly':
        return days[date.getDay()];
      case 'monthly':
        return `Day ${date.getDate()}`;
      case 'yearly':
        return months[date.getMonth()];
      default:
        return date.toLocaleDateString();
    }
  }
}
