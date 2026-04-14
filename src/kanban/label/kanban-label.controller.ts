import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { KanbanLabelService } from './kanban-label.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspacePermissionGuard } from '../../common/guards/workspace-permission.guard';

@Controller('pm-kanban/labels')
@UseGuards(JwtAuthGuard)
export class KanbanLabelController {
  constructor(private readonly labelService: KanbanLabelService) {}

  @Post()
  create(@Body() createLabelDto: { board: string; name: string; color?: string }) {
    return this.labelService.create(createLabelDto);
  }

  @Get('board/:boardId')
  findAllByBoard(@Param('boardId') boardId: string) {
    return this.labelService.findAllByBoard(boardId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLabelDto: { name?: string; color?: string }) {
    return this.labelService.update(id, updateLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.labelService.remove(id);
  }
}
