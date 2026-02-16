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
  Query,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspacePermissionGuard } from '../common/guards/workspace-permission.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

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

  @Get(':workspaceId')
  async findById(@Param('workspaceId') id: string) {
    const workspace = await this.workspaceService.findById(id);
    return {
      success: true,
      message: 'Workspace fetched successfully',
      workspace,
    };
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('MANAGE_WORKSPACE_SETTINGS')
  async update(
    @Request() req: any,
    @Param('workspaceId') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspaceService.update(id, updateWorkspaceDto, req.user.userId);
    return {
      success: true,
      message: 'Workspace updated successfully',
      workspace,
    };
  }

  @Delete(':workspaceId')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('DELETE_WORKSPACE')
  async delete(@Request() req: any, @Param('workspaceId') id: string) {
    await this.workspaceService.delete(id, req.user.userId);
    return {
      success: true,
      message: 'Workspace deleted successfully',
    };
  }

  @Get('analytics/:workspaceId')
  getWorkspaceAnalytics(
    @Param('workspaceId') workspaceId: string,
    @Query('timeframe') timeframe?: string,
  ) {
    return this.workspaceService.getAnalytics(workspaceId, timeframe);
  }

  @Get('velocity/:workspaceId')
  getWorkspaceVelocity(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.getVelocityAnalytics(workspaceId);
  }

  @Get('cfd/:workspaceId')
  getWorkspaceCFD(
    @Param('workspaceId') workspaceId: string,
    @Query('timeframe') timeframe: string = 'monthly',
  ) {
    return this.workspaceService.getCFDAnalytics(workspaceId, timeframe);
  }
}
