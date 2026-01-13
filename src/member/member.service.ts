import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { getPermissionsForRole, getRoleId } from '../common/config/roles.config';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private memberModel: Model<any>,
    @InjectModel('Workspace') private workspaceModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
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

  /**
   * Add a member to a workspace
   */
  async addMember(createMemberDto: CreateMemberDto) {
    const { userId, workspaceId, role } = createMemberDto;

    // Validate workspace exists
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Validate user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if member already exists
    const existingMember = await this.memberModel.findOne({
      userId,
      workspaceId,
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    // Create new member
    const member = new this.memberModel({
      userId,
      workspaceId,
      role: role || 'Member',
    });

    const saved = await member.save();

    // Sync user role if member role is "Owner"
    if (role === 'Owner' && user) {
      user.role = 'admin';
      await user.save();
      console.log(`✅ Synced user role to admin for ${user.firstName} ${user.lastName}`);
    }

    // Also add userId to workspace.members array for consistency
    try {
      const userObjectId = new Types.ObjectId(userId);
      if (!workspace.members.find((m: any) => m.toString() === userObjectId.toString())) {
        workspace.members.push(userObjectId);
        await workspace.save();
      }
    } catch (err) {
      console.error('Failed to update workspace.members after adding member:', err);
    }

    return saved;
  }

  /**
   * Get all members of a workspace
   */
  async getWorkspaceMembers(workspaceId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const members = await this.memberModel
      .find({ workspaceId })
      .populate('userId', 'firstName lastName email profilePicture')
      .sort({ joinedAt: -1 });

    return members.map((m: any) => {
      const enriched = this.enrichMemberWithPermissions(m);
      const user = enriched.userId || {};
      enriched.userName = user.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user.name || null;
      return enriched;
    });
  }

  /**
   * Get member details
   */
  async getMember(memberId: string) {
    const member = await this.memberModel
      .findById(memberId)
      .populate('userId', 'firstName lastName email profilePicture')
      .populate('workspaceId', 'name');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.enrichMemberWithPermissions(member);
  }

  /**
   * Get user's role in a workspace
   */
  async getUserRoleInWorkspace(userId: string, workspaceId: string) {
    const member = await this.memberModel.findOne({ userId, workspaceId });

    if (!member) {
      throw new UnauthorizedException('User is not a member of this workspace');
    }

    return {
      memberId: member._id,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  /**
   * Update member role
   */
  async updateMemberRole(memberId: string, updateMemberDto: UpdateMemberDto) {
    const { role, roleId } = updateMemberDto;

    // Allow frontend to send either `role` (display name) or `roleId` (identifier like 'admin')
    const roleMap: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      viewer: 'Viewer',
    };

    let finalRole: string | undefined = undefined;

    if (role && typeof role === 'string') {
      finalRole = role;
    } else if (roleId && typeof roleId === 'string') {
      finalRole = roleMap[roleId.toLowerCase()];
    }

    const allowed = ['Owner', 'Admin', 'Member', 'Viewer'];

    if (!finalRole || !allowed.includes(finalRole)) {
      throw new BadRequestException('Invalid or missing role');
    }

    const member = await this.memberModel
      .findByIdAndUpdate(memberId, { role: finalRole }, { new: true })
      .populate('userId', 'name email');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Sync user role if member role is "Owner"
    if (finalRole === 'Owner' && member.userId) {
      const userId = member.userId._id || member.userId;
      const user = await this.userModel.findById(userId);
      
      if (user) {
        user.role = 'admin'; // Set user role to admin when they become workspace owner
        await user.save();
        console.log(`✅ Synced user role to admin for ${user.firstName} ${user.lastName}`);
      }
    }

    return member;
  }

  /**
   * Remove member from workspace
   */
  async removeMember(memberId: string) {
    const member = await this.memberModel.findByIdAndDelete(memberId);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Also remove from workspace.members array
    try {
      const workspace = await this.workspaceModel.findById(member.workspaceId);
      if (workspace) {
        workspace.members = workspace.members.filter(
          (m: any) => m.toString() !== member.userId.toString(),
        );
        await workspace.save();
      }
    } catch (err) {
      console.error('Failed to remove user from workspace.members after deleting member:', err);
    }

    return { message: 'Member removed successfully' };
  }

  /**
   * Join workspace by invite code
   */
  async joinWorkspaceByInvite(userId: string, inviteCode: string) {
    console.log('📍 joinWorkspaceByInvite called:', { userId, inviteCode });

    // Check if user is authenticated
    if (!userId) {
      console.error('❌ No userId provided');
      throw new UnauthorizedException('User must be logged in to join a workspace');
    }

    const workspace = await this.workspaceModel.findOne({ inviteCode });
    console.log('🔍 Workspace found:', workspace?._id ? 'Yes' : 'No');

    if (!workspace) {
      console.error('❌ Workspace not found for inviteCode:', inviteCode);
      throw new NotFoundException('Invalid invite code');
    }

    // Check if already member
    const existingMember = await this.memberModel.findOne({
      userId,
      workspaceId: workspace._id,
    });

    if (existingMember) {
      console.warn('⚠️ User already member of workspace');
      throw new BadRequestException('Already a member of this workspace');
    }

    const member = new this.memberModel({
      userId,
      workspaceId: workspace._id,
      role: 'Member',
    });

    const saved = await member.save();
    console.log('✅ Member created:', saved._id);

    // Ensure workspace.members array contains this user
    try {
      const userObjectId = new Types.ObjectId(userId);
      if (!workspace.members.find((m: any) => m.toString() === userObjectId.toString())) {
        workspace.members.push(userObjectId);
        await workspace.save();
        console.log('✅ User added to workspace.members array');
      }
    } catch (err) {
      console.error('❌ Failed to update workspace.members after join:', err);
    }

    // populate saved member's user fields for response
    const populated = await this.memberModel
      .findById(saved._id)
      .populate('userId', 'firstName lastName email profilePicture');

    const enriched = this.enrichMemberWithPermissions(populated);
    const user = enriched.userId || {};
    enriched.userName = user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.name || null;

    console.log('🎉 Returning success response:', { workspaceId: workspace._id, role: 'Member' });

    return {
      workspaceId: workspace._id,
      role: 'Member',
      message: 'Successfully joined workspace',
      member: enriched,
    };
  }

  /**
   * Get member statistics
   */
  async getMemberStats(workspaceId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const totalMembers = await this.memberModel.countDocuments({ workspaceId });

    const membersByRole = await this.memberModel.aggregate([
      { $match: { workspaceId: new Types.ObjectId(workspaceId) } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalMembers,
      membersByRole,
    };
  }
}
