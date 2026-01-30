import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KanbanBoard } from '../kanban/board/schemas/kanban-board.schema';
import { KanbanColumn } from '../kanban/column/schemas/column.schema';
import { MemberService } from '../member/member.service';

@Injectable()
export class WorkspaceRolesByBoardGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private memberService: MemberService,
    @InjectModel(KanbanBoard.name)
    private boardModel: Model<KanbanBoard>,
    @InjectModel(KanbanColumn.name)
    private columnModel: Model<KanbanColumn>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true; // no role restriction

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) throw new ForbiddenException('User not authenticated');

    let workspaceId = request.params.workspaceId;

    // Resolve workspaceId from boardId if not present
    let boardIdRaw = request.params.boardId || request.body.board;
    if (!workspaceId && boardIdRaw) {
      let boardId: Types.ObjectId;
      try {
        boardId = new Types.ObjectId(boardIdRaw);
      } catch {
        throw new ForbiddenException('Invalid board ID');
      }

      const board = await this.boardModel
        .findById(boardId)
        .select('workspaceId')
        .lean();
      if (!board) throw new ForbiddenException('Board not found');

      workspaceId = board.workspaceId.toString();
    }

    // Resolve workspaceId from columnId if not present
    const columnIdRaw = request.params.columnId || request.params.id;
    if (!workspaceId && columnIdRaw) {
      let columnId: Types.ObjectId;
      try {
        columnId = new Types.ObjectId(columnIdRaw);
      } catch {
        throw new ForbiddenException('Invalid column ID');
      }

      const column = await this.columnModel
        .findById(columnId)
        .select('BoardId')
        .lean();
      if (!column) throw new ForbiddenException('Column not found');

      const board = await this.boardModel
        .findById(column.BoardId)
        .select('workspaceId')
        .lean();
      if (!board) throw new ForbiddenException('Board not found');

      workspaceId = board.workspaceId.toString();
    }

    if (!workspaceId) throw new ForbiddenException('Workspace not specified');

    // Fetch user role in workspace
    const member = await this.memberService.getUserRoleInWorkspace(userId, workspaceId);
    if (!member) throw new ForbiddenException('You are not a member of this workspace');

    if (!requiredRoles.includes(member.role))
      throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
