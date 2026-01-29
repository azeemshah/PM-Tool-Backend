import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MemberService } from '../../member/member.service';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private memberService: MemberService, // your existing service
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true; // no restriction

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const workspaceId = request.params.workspaceId || request.query.workspaceId || request.body.workspaceId || request.body.workspace;

    if (!userId) throw new ForbiddenException('User not authenticated');
    if (!workspaceId) return true; // Skip if no workspace context (let other guards handle)

    // Get member role from database
    const member = await this.memberService.getUserRoleInWorkspace(userId, workspaceId);
    if (!member) throw new ForbiddenException('You are not a member of this workspace');

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
