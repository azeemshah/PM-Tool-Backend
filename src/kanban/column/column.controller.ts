import {
  Controller,
  Get,
  Post,
  Put,
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
  constructor(private readonly columnService: ColumnService) {}

  // -------------------- Columns --------------------

  @Post('create')
  async createColumn(@Body() createColumnDto: CreateColumnDto): Promise<KanbanColumn> {
    return this.columnService.createColumn(createColumnDto);
  }

  @Put('columns/:columnId')
  async updateColumn(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ): Promise<KanbanColumn> {
    return this.columnService.updateColumn(boardId, columnId, updateColumnDto);
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
}
