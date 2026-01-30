import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Request,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ItemService } from './work-item.service';
import { CreateItemDto } from './dto/create-work-item.dto';
import { UpdateItemDto } from './dto/update-work-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspacePermissionGuard } from '../common/guards/workspace-permission.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) { }

  @Post('create')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('CREATE_TASK')
  create(@Request() req: any, @Body() dto: CreateItemDto) {
    return this.itemService.create(dto, req.user.userId);
  }

  @Get('workspace/:workspaceId')
  findByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('reporter') reporter?: string,
    @Query('keyword') keyword?: string, // <-- add this
  ) {
    return this.itemService.findByWorkspace(workspaceId, {
      page: Number(page),
      limit: Number(limit),
      status,
      priority,
      type,
      reporter,
      keyword, // <-- pass to service
    });
  }

  @Get(':id/tree')
  getTree(@Param('id') id: string) {
    return this.itemService.findTree(id);
  }

  @Patch(':id/move/column/:columnId')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('EDIT_TASK')
  moveToColumn(
    @Param('id') id: string,
    @Param('columnId') columnId: string,
    @Request() req,
  ) {
    return this.itemService.moveToColumn(id, columnId, req.user?.userId);
  moveToColumn(@Param('id') id: string, @Param('columnId') columnId: string, @Request() req: any) {
    return this.itemService.moveToColumn(id, columnId, req.user.userId);
  }

  @Patch(':id/move/backlog')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('EDIT_TASK')
  moveToBacklog(@Param('id') id: string, @Request() req: any) {
    return this.itemService.moveToBacklog(id, req.user.userId);
  }

  @Post('update/:id')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('EDIT_TASK')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto, @Request() req) {
    return this.itemService.update(id, dto, req.user?.userId);
  update(@Param('id') id: string, @Body() dto: UpdateItemDto, @Request() req: any) {
    return this.itemService.update(id, dto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('EDIT_TASK')
  updatePatch(@Param('id') id: string, @Body() dto: UpdateItemDto, @Request() req) {
    return this.itemService.update(id, dto, req.user?.userId);
  updatePatch(@Param('id') id: string, @Body() dto: UpdateItemDto, @Request() req: any) {
    return this.itemService.update(id, dto, req.user.userId);
  }

  @Delete('delete/:id')
  @UseGuards(WorkspacePermissionGuard)
  @Permissions('DELETE_TASK')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.itemService.delete(id, req.user.userId);
  }
}
