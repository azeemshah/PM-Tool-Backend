import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { ProjectRoleService } from './project-role.service';

@Controller('project-roles')
export class ProjectRoleController {
  constructor(private readonly projectRoleService: ProjectRoleService) {}

  @Post()
  assignRole(@Body() body: any) {
    return this.projectRoleService.assignRole(body);
  }

  @Get('project/:projectId')
  getProjectRoles(@Param('projectId') projectId: string) {
    return this.projectRoleService.getByProject(projectId);
  }

  @Delete(':id')
  removeRole(@Param('id') id: string) {
    return this.projectRoleService.remove(id);
  }
}
