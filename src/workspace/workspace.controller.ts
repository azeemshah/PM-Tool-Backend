import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('workspace')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('create/new')
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    const workspace = await this.workspaceService.create(createWorkspaceDto, req.user.userId);
    return {
      success: true,
      message: 'Workspace created successfully',
      workspace,
    };
  }

  @Get('all')
  async findAll(@Request() req: any) {
    const workspaces = await this.workspaceService.findAll(req.user.userId);
    return {
      success: true,
      message: 'Workspaces fetched successfully',
      workspaces,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const workspace = await this.workspaceService.findById(id);
    return {
      success: true,
      message: 'Workspace fetched successfully',
      workspace,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceService.update(id, updateWorkspaceDto);
    return {
      success: true,
      message: 'Workspace updated successfully',
      workspace,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    if (!req.user || !req.user.userId) {
      throw new Error('User not authenticated');
    }
    
    const userId = req.user.userId;
    await this.workspaceService.delete(id);
    
    try {
      // Find another workspace the user is member of
      const userWorkspaces = await this.workspaceService.findAll(userId);
      const nextWorkspaceId = userWorkspaces && userWorkspaces.length > 0 
        ? userWorkspaces[0]._id 
        : null;
      
      return {
        success: true,
        message: 'Workspace deleted successfully',
        currentWorkspace: nextWorkspaceId,
      };
    } catch (error) {
      console.error('Error finding next workspace:', error);
      return {
        success: true,
        message: 'Workspace deleted successfully',
        currentWorkspace: null,
      };
    }
  }

  @Post(':id/members/:userId')
  async addMember(@Param('id') id: string, @Param('userId') userId: string) {
    const workspace = await this.workspaceService.addMember(id, userId);
    return {
      success: true,
      message: 'Member added to workspace',
      workspace,
    };
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    const workspace = await this.workspaceService.removeMember(id, userId);
    return {
      success: true,
      message: 'Member removed from workspace',
      workspace,
    };
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    const members = await this.workspaceService.getMembers(id);
    return {
      success: true,
      message: 'Members fetched successfully',
      members,
    };
  }

  @Get('analytics/:id')
  async getAnalytics(@Param('id') id: string) {
    const analytics = await this.workspaceService.getAnalytics(id);
    return {
      statusCode: 200,
      message: 'Analytics fetched successfully',
      analytics,
    };
  }
}
