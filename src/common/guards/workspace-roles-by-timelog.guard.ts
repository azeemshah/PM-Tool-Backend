import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MemberService } from '../../member/member.service';

@Injectable()
export class WorkspaceRolesByTimelogGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private memberService: MemberService,
    @InjectModel('TimeLog') private timeLogModel: Model<any>,
    @InjectModel('Item') private itemModel: Model<any>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true; // no restriction

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const timelogId = request.params.id; // Get the timelog ID from route params

    if (!userId) throw new ForbiddenException('User not authenticated');
    if (!timelogId) throw new ForbiddenException('Time log ID is required');

    // Get the timelog to find the associated work item
    const timelog = await this.timeLogModel.findById(timelogId);
    if (!timelog) throw new ForbiddenException('Time log not found');

    // Get the work item to find the workspace
    const workItem = await this.itemModel.findById(timelog.workItemId);
    if (!workItem) throw new ForbiddenException('Work item not found');

    const workspaceId = workItem.workspace;
    if (!workspaceId) throw new ForbiddenException('Workspace not found for this time log');

    // Get member role from database
    const member = await this.memberService.getUserRoleInWorkspace(userId, workspaceId);
    if (!member) throw new ForbiddenException('You are not a member of this workspace');

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
