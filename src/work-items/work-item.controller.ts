import { Controller, Post, Body, Get, Param, Patch, Request, Put, Delete } from '@nestjs/common';
import { ItemService } from './work-item.service';
import { CreateItemDto } from './dto/create-work-item.dto';
import { UpdateItemDto } from './dto/update-work-item.dto';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) { }

  @Post('create')
  create(@Request() req: any, @Body() dto: CreateItemDto) {
    return this.itemService.create(dto);
  }

  @Get('workspace/:workspaceId')
  findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.itemService.findByWorkspace(workspaceId);
  }

  @Get(':id/tree')
  getTree(@Param('id') id: string) {
    return this.itemService.findTree(id);
  }

  @Patch(':id/move/column/:columnId')
  moveToColumn(@Param('id') id: string, @Param('columnId') columnId: string) {
    return this.itemService.moveToColumn(id, columnId);
  }

  @Patch(':id/move/backlog')
  moveToBacklog(@Param('id') id: string) {
    return this.itemService.moveToBacklog(id);
  }

  @Post('update/:id')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.update(id, dto);
  }

  @Patch(':id')
  updatePatch(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.update(id, dto);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.itemService.delete(id);
  }

}
