import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { getPermissionsForRole } from '../config/roles.config';
import { Item } from '@/work-items/schemas/work-item.schema';
import { KanbanBoard } from '@/kanban/board/schemas/kanban-board.schema';
import { Workspace } from '@/workspace/schemas/workspace.schema';

@Injectable()
export class WorkspacePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel('Member') private memberModel: Model<any>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(KanbanBoard.name) private boardModel: Model<KanbanBoard>,
    @InjectModel(Workspace.name) private workspaceModel: Model<Workspace>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.userId;
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const workspaceId = await this.resolveWorkspaceId(req);
    if (!workspaceId) {
      throw new BadRequestException('Workspace context not found');
    }

    let member = await this.memberModel.findOne({
      userId: new Types.ObjectId(userId),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!member) {
      // Fallback: infer membership from workspace document
      const workspace = await this.workspaceModel
        .findById(workspaceId)
        .select('OwnedBy members')
        .lean();
      const isMember =
        workspace &&
        (workspace.OwnedBy?.toString() === userId ||
          (workspace.members || []).some((m: any) => m?.toString() === userId));
      if (!isMember) {
        throw new ForbiddenException('User is not a member of this workspace');
      }
      // Infer role if member doc missing
      const inferredRole = workspace.OwnedBy?.toString() === userId ? 'Owner' : 'Member';
      member = { role: inferredRole } as any;
    }

    const permissions = getPermissionsForRole(member.role);
    const allowed = required.every((p) => permissions.includes(p));

    if (!allowed) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }

    return true;
  }

  private async resolveWorkspaceId(req: any): Promise<string | undefined> {
    // Common sources
    if (req.params?.workspaceId) return req.params.workspaceId;
    if (req.body?.workspace) return req.body.workspace;

    // If operating on a board, extract workspace by fetching the board
    const boardId: string | undefined = req.params?.boardId || req.params?.id || undefined;
    if (boardId) {
      try {
        const board = await this.boardModel.findById(boardId).select('workspaceId').lean();
        if (board?.workspaceId) return board.workspaceId.toString();
      } catch {
        // ignore
      }
    }

    // If operating on an item, extract workspace by fetching the item
    const itemId: string | undefined =
      req.params?.id || req.params?.itemId || req.body?.itemId || undefined;
    if (itemId) {
      try {
        const item = await this.itemModel.findById(itemId).select('workspace').lean();
        return item?.workspace?.toString();
      } catch {
        return undefined;
      }
    }

    return undefined;
  }
}
