import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  GoneException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtService } from '@nestjs/jwt';
import { Invitation, InvitationDocument } from './schemas/invitation.schema';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../kanban/notification/notification.service';
import { NotificationType } from '../kanban/notification/schemas/notification.schema';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private memberModel: Model<any>,
    @InjectModel('Workspace') private workspaceModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel(Invitation.name) private invitationModel: Model<InvitationDocument>,
    private jwtService: JwtService,
    private mailService: EmailService,
    private notificationService: NotificationService,
    private configService: ConfigService,
  ) {}

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

    // Also add userId to workspace.members array for consistency
    try {
      const userObjectId = new Types.ObjectId(userId);
      if (!workspace.members.find((m: any) => m.toString() === userObjectId.toString())) {
        workspace.members.push(userObjectId);
        await workspace.save();
      }

      // Notify workspace members
      const memberIds = workspace.members.map((m: any) => m.toString());
      const ownerId = workspace.OwnedBy?.toString();
      const allIds = new Set([...memberIds, ownerId].filter(Boolean));

      for (const recipientId of allIds) {
          // if (recipientId === userId) continue;

          await this.notificationService.create({
              recipient: new Types.ObjectId(recipientId),
              type: NotificationType.MEMBER_ADDED,
              message: `User ${user.firstName} ${user.lastName} joined the workspace ${workspace.name}`,
              workspace: workspace._id,
          });
      }
    } catch (err) {
      console.error('Failed to update workspace.members or notify:', err);
    }

    return saved;
  }

  /**
   * Get all members of a workspace
   */
  async getWorkspaceMembers(workspaceId: string) {
    const members = await this.memberModel
      .find({ workspaceId })
      .populate('userId', 'firstName lastName email avatar')
      .exec();

    // Also get the owner
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('OwnedBy', 'firstName lastName email avatar')
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const result = members.map((member: any) => ({
      _id: member._id,
      user: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    // If owner is not in members list (sometimes happens), add them
    const ownerId = workspace.OwnedBy?._id?.toString();
    const isOwnerInMembers = result.some((m) => m.user?._id?.toString() === ownerId);

    if (workspace.OwnedBy && !isOwnerInMembers) {
      result.unshift({
        _id: 'owner_placeholder',
        user: workspace.OwnedBy,
        role: 'Owner',
        joinedAt: workspace.createdAt,
      });
    }

    return result;
  }

  /**
   * Get member details
   */
  async getMember(memberId: string) {
    const member = await this.memberModel
      .findById(memberId)
      .populate('userId', 'firstName lastName email avatar')
      .populate('workspaceId', 'name');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
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
      team_lead: 'Team Lead',
      project_manager: 'Project Manager',
      member: 'Member',
      viewer: 'Viewer',
      watcher: 'Watcher',
    };

    let finalRole: string | undefined = undefined;

    if (role && typeof role === 'string') {
      finalRole = role;
    } else if (roleId && typeof roleId === 'string') {
      finalRole = roleMap[roleId.toLowerCase()];
    }

    const allowed = ['Owner', 'Admin', 'Team Lead', 'Project Manager', 'Member', 'Viewer', 'Watcher'];

    if (!finalRole || !allowed.includes(finalRole)) {
      throw new BadRequestException('Invalid or missing role');
    }

    const member = await this.memberModel
      .findByIdAndUpdate(memberId, { role: finalRole }, { new: true })
      .populate('userId', 'firstName lastName email avatar');

    if (!member) {
      throw new NotFoundException('Member not found');
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

  // ===============================
  // Join workspace by invite code
  // ===============================
  async joinWorkspaceByInviteCode(inviteCode: string, userId: string) {
    try {
      // Validate user exists
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Find workspace by invite code
      const workspace = await this.workspaceModel.findOne({ inviteCode });
      if (!workspace) {
        throw new NotFoundException('Invalid invite code');
      }

      // Check if user is already a member
      const existingMember = await this.memberModel.findOne({
        userId,
        workspaceId: workspace._id,
      });

      if (existingMember) {
        throw new ConflictException('User is already a member of this workspace');
      }

      // Add user to workspace
      const member = new this.memberModel({
        userId,
        workspaceId: workspace._id,
        role: 'Member',
      });

      const savedMember = await member.save();

      // Also add to workspace members array
      const userObjectId = new Types.ObjectId(userId);
      if (!workspace.members.find((m: any) => m.toString() === userObjectId.toString())) {
        workspace.members.push(userObjectId);
        await workspace.save();
      }

      return {
        statusCode: 200,
        message: 'Successfully joined workspace',
        data: {
          workspaceId: workspace._id.toString(),
          memberId: savedMember._id.toString(),
          role: 'Member',
        },
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw new InternalServerErrorException('Failed to join workspace');
    }
  }
  // 🔑 Send invitation email
  async sendInvitation(
    email: string,
    role: 'ADMIN' | 'TEAM_LEAD' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER',
    invitedBy: string,
    workspaceId: string,
  ) {
    try {
      // Check for existing invitation
      const existingInvite = await this.invitationModel.findOne({
        email,
        status: 'PENDING',
      });

      if (existingInvite) {
        if (existingInvite.expiresAt < new Date()) {
          // Expired → allow resend
          existingInvite.status = 'EXPIRED';
          await existingInvite.save();
        } else {
          // // Active invite still exists
          // throw new ConflictException('Active invitation already exists');
        }
      }

      // Generate secure token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Expiration 7 days
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Save invitation to DB
      await this.invitationModel.create({
        email,
        role,
        tokenHash,
        invitedBy,
        workspaceId,
        expiresAt,
        status: 'PENDING',
      });

      // Fetch workspace to get inviteCode
      const workspace = await this.workspaceModel.findById(workspaceId);
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      const inviteLink = `${this.configService.get('FRONTEND_URL')}/invite?token=${rawToken}`;

      // Check if user exists to send in-app notification
      const existingUser = await this.userModel.findOne({ email });

      if (existingUser) {
         // Send in-app notification
         try {
             await this.notificationService.create({
                 recipient: existingUser._id,
                 type: NotificationType.MEMBER_ADDED, // Using MEMBER_ADDED as proxy for invitation
                 message: `You have been invited to join workspace "${workspace.name}" as ${role}`,
                 workspace: workspace._id,
             });
         } catch (err) {
             console.error('Failed to send in-app invitation notification:', err);
         }
      }

      // Send invite email with workspace inviteCode
      // We keep sending email because invitation link is needed even for existing users if they are not logged in
      await this.mailService.sendInvite(email, role, inviteLink, workspace.inviteCode);

      return { message: 'Invitation email sent successfully' };
    } catch (error) {
      //console.error('Failed to send invitation:', error);
      throw new InternalServerErrorException('Failed to send invitation');
    }
  }

  // ===============================
  // Accept invitation
  // ===============================
  async acceptInvitation(token: string) {
    try {
      console.log('🔍 [acceptInvitation] START: Received token:', token.substring(0, 10) + '...');

      if (!token || token.length < 10) {
        console.error('❌ [acceptInvitation] Invalid token format');
        throw new BadRequestException('Invalid token format');
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      console.log('🔍 [acceptInvitation] Generated tokenHash:', tokenHash.substring(0, 10) + '...');
      console.log('🔍 [acceptInvitation] Looking for invitation in database...');

      const invite = await this.invitationModel.findOne({ tokenHash });

      if (!invite) {
        console.error(
          '❌ [acceptInvitation] Invitation NOT found with tokenHash:',
          tokenHash.substring(0, 10) + '...',
        );
        console.log('🔍 [acceptInvitation] Checking all invitations in database for debugging...');
        const allInvites = await this.invitationModel.find({});
        console.log('📊 [acceptInvitation] Total invitations in DB:', allInvites.length);
        allInvites.forEach((inv: any) => {
          console.log(
            '  - Status:',
            inv.status,
            'Email:',
            inv.email,
            'Hash:',
            inv.tokenHash?.substring(0, 10) + '...',
          );
        });
        throw new UnauthorizedException('Invalid or expired invitation');
      }

      console.log(
        '✅ [acceptInvitation] Invitation found - Email:',
        invite.email,
        'Status:',
        invite.status,
      );

      if (invite.status === 'ACCEPTED') {
        console.error('❌ [acceptInvitation] Invitation already used');
        throw new ConflictException('This invitation has already been accepted');
      }

      if (invite.expiresAt < new Date()) {
        console.error('❌ [acceptInvitation] Invitation expired at:', invite.expiresAt);
        invite.status = 'EXPIRED';
        await invite.save();
        throw new GoneException('Invitation has expired. Please request a new one.');
      }

      console.log('✅ [acceptInvitation] Invitation valid and not expired');

      // Map invitation role to Member schema role format
      const roleMap = {
        ADMIN: 'Admin',
        MEMBER: 'Member',
        VIEWER: 'Viewer',
        WATCHER: 'Watcher',
      };
      const memberRole = roleMap[invite.role as keyof typeof roleMap];

      // Check if user already exists
      let user = await this.userModel.findOne({ email: invite.email });
      console.log('✅ [acceptInvitation] User lookup - found:', !!user);

      if (!user) {
        // Create new user
        const tempPassword = crypto.randomBytes(8).toString('hex');
        console.log('✅ [acceptInvitation] Creating new user for email:', invite.email);

        user = await this.userModel.create({
          email: invite.email,
          firstName: invite.email.split('@')[0],
          lastName: 'User',
          password: tempPassword,
          isEmailVerified: true,
        });

        console.log('✅ [acceptInvitation] User created successfully - ID:', user._id);

        // Send temp password via email
        try {
          await this.mailService.sendTempPassword(invite.email, tempPassword);
          console.log('✅ [acceptInvitation] Temp password email sent to:', invite.email);
        } catch (emailError) {
          console.warn(
            '⚠️ [acceptInvitation] Failed to send temp password email:',
            emailError.message,
          );
        }
      }

      // Check if member already exists in this workspace
      let member = await this.memberModel.findOne({
        userId: user._id,
        workspaceId: invite.workspaceId,
      });
      console.log('✅ [acceptInvitation] Member in workspace lookup - found:', !!member);

      if (!member) {
        // Create member in the workspace
        console.log('✅ [acceptInvitation] Creating new member for workspace:', invite.workspaceId);
        member = await this.memberModel.create({
          userId: user._id,
          workspaceId: invite.workspaceId,
          role: memberRole,
        });

        console.log('✅ [acceptInvitation] Member created successfully - ID:', member._id);
      } else {
        // Update member role
        member.role = memberRole;
        await member.save();
        console.log('✅ [acceptInvitation] Member role updated to:', memberRole);
      }

      // Mark invite as accepted
      invite.status = 'ACCEPTED';
      await invite.save();
      console.log('✅ [acceptInvitation] Invitation marked as ACCEPTED');

      // Add to workspace members array if not present
      const workspace = await this.workspaceModel.findById(invite.workspaceId);
      if (workspace) {
        const userObjectId = new Types.ObjectId(user._id);
        if (!workspace.members.find((m: any) => m.toString() === userObjectId.toString())) {
          workspace.members.push(userObjectId);
          await workspace.save();
        }

        // Notify workspace members
        const memberIds = workspace.members.map((m: any) => m.toString());
        const ownerId = workspace.OwnedBy?.toString();
        const allIds = new Set([...memberIds, ownerId].filter(Boolean));

        for (const recipientId of allIds) {
            if (recipientId === user._id.toString()) continue;

            try {
              await this.notificationService.create({
                  recipient: new Types.ObjectId(recipientId),
                  type: NotificationType.MEMBER_ADDED,
                  message: `User ${user.firstName} ${user.lastName} joined the workspace ${workspace.name}`,
                  workspace: workspace._id,
              });
            } catch (err) {
              console.error('Failed to notify member about new user:', err);
            }
        }
      }

      // Generate JWT access token
      const accessToken = this.jwtService.sign({
        sub: user._id,
        email: user.email,
      });

      console.log('✅ [acceptInvitation] Access token generated successfully');
      console.log('✅ [acceptInvitation] SUCCESS: Returning access token');

      return {
        message: 'Invitation accepted successfully',
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        member: {
          id: member._id,
          role: member.role,
          workspaceId: member.workspaceId,
        },
      };
    } catch (error) {
      console.error('❌ [acceptInvitation] FAILED - Error:', error.message);
      console.error('❌ [acceptInvitation] Stack:', error.stack);

      // Re-throw the error as-is if it's already a proper HTTP exception
      if (error.getStatus) {
        throw error;
      }

      // Otherwise wrap it
      throw new InternalServerErrorException('Failed to accept invitation: ' + error.message);
    }
  }
}
