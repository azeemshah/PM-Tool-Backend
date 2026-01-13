import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProjectManagementService } from './project-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('project-management')
@UseGuards(JwtAuthGuard)
export class ProjectManagementController {
  constructor(private readonly projectManagementService: ProjectManagementService) {}

  @Get(':workspaceId')
  async getProjectsByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.projectManagementService.getProjectsByWorkspace(workspaceId);
  }
}
