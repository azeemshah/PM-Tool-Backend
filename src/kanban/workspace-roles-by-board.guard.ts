import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KanbanBoard } from '../kanban/board/schemas/kanban-board.schema';
import { MemberService } from '../member/member.service';

@Injectable()
export class WorkspaceRolesByBoardGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private memberService: MemberService,
    @InjectModel(KanbanBoard.name)
    private boardModel: Model<KanbanBoard>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true; // no role restriction

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenException('User not authenticated');

    let workspaceId = request.params.workspaceId;

    // Resolve workspaceId from boardId if not present
    const boardIdRaw = request.params.boardId || request.body.board;
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

    if (!workspaceId) throw new ForbiddenException('Workspace not specified');

    // Fetch user role in workspace
    const member = await this.memberService.getUserRoleInWorkspace(userId, workspaceId);
    if (!member) throw new ForbiddenException('You are not a member of this workspace');

    if (!requiredRoles.includes(member.role))
      throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
