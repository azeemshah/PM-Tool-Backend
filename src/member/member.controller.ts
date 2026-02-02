import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private memberService: MemberService) {}

  /**
   * Join workspace by invite code
   * POST /members/join/:inviteCode
   * 🌐 PUBLIC – allow unauthenticated users to join via invite link
   */
  @Public()
  @Post('join/:inviteCode')
  async joinWorkspace(@Param('inviteCode') inviteCode: string, @Request() req: any) {
    return this.memberService.joinWorkspaceByInviteCode(inviteCode, req.user?.userId);
  }

  // 🔐 ADMIN ONLY
    @Roles('Owner', 'Admin')
    @UseGuards(WorkspaceRolesGuard)
  @Post('invite')
  async inviteMember(@Body() dto: InviteMemberDto, @Request() req: any) {
    await this.memberService.sendInvitation(dto.email, dto.role, req.user.userId, dto.workspaceId);
    return { message: 'Invitation email sent' };
  }

  // 🌐 PUBLIC – invite link access
  @Public()
  @Post('invite/accept')
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.memberService.acceptInvitation(dto.token);
  }

  /**
   * Add a new member to a workspace
   * POST /members
   */
  @Post()
  async addMember(@Body() createMemberDto: CreateMemberDto) {
    const member = await this.memberService.addMember(createMemberDto);
    return {
      statusCode: 201,
      message: 'Member added successfully',
      data: member,
    };
  }

  /**
   * Get current user's role in a workspace
   * GET /members/me/role/:workspaceId
   */
  @Get('me/role/:workspaceId')
  async getUserRoleInWorkspace(@Param('workspaceId') workspaceId: string, @Request() req: any) {
    const userRole = await this.memberService.getUserRoleInWorkspace(req.user.userId, workspaceId);
    return {
      statusCode: 200,
      message: 'User role retrieved',
      data: userRole,
    };
  }

  /**
   * Get all members of a workspace with available roles
   * GET /members/workspace/:workspaceId
   */
  @Get('workspace/:workspaceId')
  async getWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    const members = await this.memberService.getWorkspaceMembers(workspaceId);

    // Return available roles along with members
    const roles = [
      { _id: 'admin', name: 'Admin' },
      { _id: 'team_lead', name: 'Team Lead' },
      { _id: 'project_manager', name: 'Project Manager' },
      { _id: 'member', name: 'Member' },
      { _id: 'viewer', name: 'Viewer' },
    ];

    return {
      statusCode: 200,
      message: 'Members retrieved successfully',
      data: {
        members,
        roles,
      },
    };
  }

  /**
   * Get member details
   * GET /members/:memberId
   */
  @Get(':memberId')
  async getMember(@Param('memberId') memberId: string) {
    const member = await this.memberService.getMember(memberId);
    return {
      statusCode: 200,
      message: 'Member retrieved successfully',
      data: member,
    };
  }

  /**
   * Update member role
   * PUT /members/:memberId
   */
  @Put(':memberId')
  async updateMemberRole(
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    const member = await this.memberService.updateMemberRole(memberId, updateMemberDto);
    return {
      statusCode: 200,
      message: 'Member updated successfully',
      data: member,
    };
  }

  /**
   * Remove member from workspace
   * DELETE /members/:memberId
   */
  @Delete(':memberId')
  async removeMember(@Param('memberId') memberId: string) {
    const result = await this.memberService.removeMember(memberId);
    return {
      statusCode: 200,
      message: result.message,
    };
  }
}
