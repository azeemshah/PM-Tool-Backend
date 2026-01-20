import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { AddWorkItemsToSprintDto } from './dto/add-workitems-to-sprint.dto';

@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  createSprint(@Body() dto: CreateSprintDto) {
    return this.sprintService.createSprint(dto);
  }

  @Get('workspace/:workspaceId')
  getWorkspaceSprints(@Param('workspaceId') workspaceId: string) {
    return this.sprintService.getWorkspaceSprints(workspaceId);
  }

  @Patch(':id/start')
  startSprint(@Param('id') id: string) {
    return this.sprintService.startSprint(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.sprintService.completeSprint(id);
  }

  @Patch(':id/reopen')
reopenSprint(@Param('id') id: string) {
  return this.sprintService.reopenSprint(id);
}

  @Patch(':id/add-work-items')
    addWorkItemsToSprint(
    @Param('id') sprintId: string,
    @Body() dto: AddWorkItemsToSprintDto,
) {
    return this.sprintService.addWorkItemsToSprintAndUpdateStatus(
    sprintId,
    dto,
  );
}

  @Patch(':id/columns')
  updateSprintColumns(
    @Param('id') sprintId: string,
    @Body() body: { columns: string[] }
  ) {
    return this.sprintService.updateSprintColumns(sprintId, body.columns);
  }
}
