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
import {
  Invitation,
  InvitationDocument,
} from './schemas/invitation.schema';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private memberModel: Model<any>,
    @InjectModel('Workspace') private workspaceModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel(Invitation.name) private invitationModel: Model<InvitationDocument>,
    private jwtService: JwtService,
    private mailService: EmailService,
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
      const obj = m.toObject ? m.toObject() : m;
      const user = obj.userId || {};
      obj.userName = user.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user.name || null;
      return obj;
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

 
 // 🔑 Send invitation email
  async sendInvitation(
    email: string,
    role: 'USER' | 'VIEWER',
    invitedBy: string,
  ) {
    try {
      // Check for existing invitation
      let existingInvite = await this.invitationModel.findOne({
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
        expiresAt,
        status: 'PENDING',
      });

      const inviteLink = `${this.configService.get('FRONTEND_URL')}/invite?token=${rawToken}`;

      // Send invite email
      await this.mailService.sendInvite(email, role, inviteLink);

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
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const invite = await this.invitationModel.findOne({ tokenHash });

      if (!invite) throw new UnauthorizedException('Invalid invitation');
      if (invite.status === 'ACCEPTED') throw new ConflictException('Invitation already used');

      if (invite.expiresAt < new Date()) {
        invite.status = 'EXPIRED';
        await invite.save();
        throw new GoneException('Invitation expired');
      }

      // Check if member already exists
      let member = await this.memberModel.findOne({ email: invite.email });

      if (!member) {
        // Create member with temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        member = await this.memberModel.create({
          email: invite.email,
          role: invite.role,
          passwordHash,
          passwordSet: false,
          invited: true,
        });

        // Send temp password via email
        await this.mailService.sendTempPassword(invite.email, tempPassword);
      }

      // Mark invite as accepted
      invite.status = 'ACCEPTED';
      await invite.save();

      // Generate JWT access token
      const accessToken = this.jwtService.sign({
        sub: member._id,
        role: member.role,
      });

      return {
        message: 'Login successful',
        accessToken,
        member: {
          id: member._id,
          email: member.email,
          role: member.role,
        },
      };
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw new InternalServerErrorException('Failed to accept invitation');
    }
  }
}
