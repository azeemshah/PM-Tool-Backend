// src/kanban/board/kanban-board.controller.ts
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
import { KanbanBoardService } from './kanban-board.service';
import { KanbanBoard } from './schemas/kanban-board.schema';
import { KanbanColumn } from '../column/schemas/column.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { MoveWorkItemDto } from './dto/move-work-item.dto';

@Controller('kanban')
export class KanbanBoardController {
  constructor(private readonly boardService: KanbanBoardService) {}

  // -------------------- Boards --------------------

  @Post('boards')
  async createBoard(@Body() createBoardDto: CreateBoardDto): Promise<KanbanBoard> {
    return this.boardService.createBoard(createBoardDto);
  }

  @Get('board/workspaces/:workspaceId/boards')
  async findBoardsByWorkspace(@Param('workspaceId') workspaceId: string): Promise<KanbanBoard[]> {
    return this.boardService.findBoardsByWorkspaceId(workspaceId);
  }

  @Get('board/:id')
  async findBoardById(@Param('id') id: string): Promise<KanbanBoard> {
    return this.boardService.findBoardById(id);
  }

  @Put('boards/:id')
  async updateBoard(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<KanbanBoard> {
    return this.boardService.updateBoard(id, updateBoardDto);
  }

  @Delete('boards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoard(@Param('id') id: string): Promise<void> {
    return this.boardService.deleteBoard(id);
  }

  // -------------------- Board Columns --------------------

  @Get('boards/:boardId/columns')
  async getBoardColumns(@Param('boardId') boardId: string): Promise<KanbanColumn[]> {
    return this.boardService.getBoardColumns(boardId);
  }

  // -------------------- Move Work Item --------------------

  @Post('boards/:boardId/move-work-item')
  async moveWorkItem(@Param('boardId') boardId: string, @Body() moveWorkItemDto: MoveWorkItemDto) {
    return this.boardService.moveWorkItem(boardId, moveWorkItemDto);
  }

  // -------------------- Reorder Cards in List --------------------

  @Put('boards/:boardId/columns/:columnId/reorder-cards')
  async reorderCardsInList(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() body: { cardIds: string[] },
  ) {
    return this.boardService.reorderCardsInList(boardId, columnId, body.cardIds);
  }
}
