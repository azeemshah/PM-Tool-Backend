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
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ColumnService } from './column.service';
import { KanbanColumn } from './schemas/column.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkspaceRolesByBoardGuard } from './../workspace-roles-by-board.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm-column')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  // -------------------- Columns --------------------
  @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesByBoardGuard)
  @Post('create')
  async createColumn(
    @Body() createColumnDto: CreateColumnDto,
    @CurrentUser('userId') userId: string,
  ): Promise<KanbanColumn> {
    return this.columnService.createColumn(createColumnDto, userId);
  }

  @UseGuards(WorkspaceRolesByBoardGuard)
  @Roles('Owner', 'Admin', 'Member')
  @Put('columns/:columnId')
  async updateColumn(
    @Param('columnId') columnId: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ): Promise<KanbanColumn> {
    return this.columnService.updateColumn(columnId, updateColumnDto);
  }

  @UseGuards(WorkspaceRolesByBoardGuard)
  @Roles('Owner', 'Admin', 'Member')
  @Delete('columns/:columnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteColumn(
    @Param('columnId') columnId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    return this.columnService.deleteColumn(columnId, userId);
  }

  @Get(':boardId/columns')
  async getColumns(@Param('boardId') boardId: string): Promise<KanbanColumn[]> {
    return this.columnService.getBoardColumns(boardId);
  }

  @UseGuards(WorkspaceRolesByBoardGuard)
  @Roles('Owner', 'Admin', 'Member')
  @Patch('move/:id')
  async moveColumn(@Param('id') columnId: string, @Body('position') position: number) {
    return this.columnService.moveColumn(columnId, position);
  }

  @UseGuards(WorkspaceRolesByBoardGuard)
  @Roles('Owner', 'Admin', 'Member')
  @Put('columns/reorder/:boardId')
  async reorderColumns(@Param('boardId') boardId: string, @Body() body: { columnIds: string[] }) {
    return this.columnService.reorderColumns(boardId, body.columnIds);
  }
}
