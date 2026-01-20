import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ColumnService } from './column.service';
import { KanbanColumn } from './schemas/column.schema';

@Controller('column')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) { }

  // -------------------- Columns --------------------

  @Post('create')
  async createColumn(@Body() createColumnDto: CreateColumnDto): Promise<KanbanColumn> {
    return this.columnService.createColumn(createColumnDto);
  }

  @Put('columns/:columnId')
  async updateColumn(
    @Param('columnId') columnId: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ): Promise<KanbanColumn> {
    return this.columnService.updateColumn(columnId, updateColumnDto);
  }

  @Delete('columns/:columnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteColumn(@Param('columnId') columnId: string): Promise<void> {
    return this.columnService.deleteColumn(columnId);
  }

  @Get(':boardId/columns')
  async getColumns(@Param('boardId') boardId: string): Promise<KanbanColumn[]> {
    return this.columnService.getBoardColumns(boardId);
  }

  @Patch('move/:id')
  async moveColumn(
    @Param('id') columnId: string,
    @Body('position') position: number,
  ) {
    return this.columnService.moveColumn(columnId, position);
  }

  @Put('columns/reorder/:boardId')
  async reorderColumns(
    @Param('boardId') boardId: string,
    @Body() body: { columnIds: string[] },
  ) {
    return this.columnService.reorderColumns(boardId, body.columnIds);
  }
}
