import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  create(@Body() body: any) {
    return this.workflowService.create(body);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.workflowService.getByProject(projectId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.workflowService.update(id, body);
  }
}
