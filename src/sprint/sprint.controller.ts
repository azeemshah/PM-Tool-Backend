import { Body, Controller, Get, Param, Patch, Post, UseGuards, Delete } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { AddWorkItemsToSprintDto } from './dto/add-workitems-to-sprint.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sprints')
@UseGuards(JwtAuthGuard)
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  createSprint(@Body() dto: CreateSprintDto, @CurrentUser('userId') userId?: string) {
    return this.sprintService.createSprint(dto, userId);
  }

  @Get('workspace/:workspaceId')
  getWorkspaceSprints(@Param('workspaceId') workspaceId: string) {
    return this.sprintService.getWorkspaceSprints(workspaceId);
  }

  @Patch(':id/start')
  startSprint(@Param('id') id: string, @CurrentUser('userId') userId?: string) {
    return this.sprintService.startSprint(id, userId);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body('targetSprintId') targetSprintId?: string,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.sprintService.completeSprint(id, targetSprintId, userId);
  }

  @Patch(':id/reopen')
  reopenSprint(@Param('id') id: string) {
    return this.sprintService.reopenSprint(id);
  }

  @Patch(':id/add-work-items')
  addWorkItemsToSprint(@Param('id') sprintId: string, @Body() dto: AddWorkItemsToSprintDto) {
    return this.sprintService.addWorkItemsToSprintAndUpdateStatus(sprintId, dto);
  }

  @Patch(':id/columns')
  updateSprintColumns(@Param('id') sprintId: string, @Body() body: { columns: string[] }) {
    return this.sprintService.updateSprintColumns(sprintId, body.columns);
  }

  @Patch(':id')
  updateSprintDetails(
    @Param('id') sprintId: string,
    @Body() body: Partial<{ name: string; goal?: string; startDate: string; endDate: string }>,
  ) {
    return this.sprintService.updateSprintDetails(sprintId, body);
  }

  @Delete(':id')
  deleteSprint(@Param('id') sprintId: string) {
    return this.sprintService.deleteSprint(sprintId);
  }
}
