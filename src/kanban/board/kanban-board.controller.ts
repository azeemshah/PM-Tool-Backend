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
  UseGuards,
} from '@nestjs/common';
import { KanbanBoardService } from './kanban-board.service';
import { KanbanBoard } from './schemas/kanban-board.schema';
import { KanbanColumn } from '../column/schemas/column.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { MoveWorkItemDto } from './dto/move-work-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspacePermissionGuard } from '../../common/guards/workspace-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('pm-kanban')
export class KanbanBoardController {
  constructor(private readonly boardService: KanbanBoardService) {}

  // -------------------- Boards --------------------

  @Post('boards')
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async createBoard(@Body() createBoardDto: CreateBoardDto): Promise<KanbanBoard> {
    return this.boardService.createBoard(createBoardDto);
  }

  @Get('board/workspaces/:workspaceId/boards')
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async findBoardsByWorkspace(@Param('workspaceId') workspaceId: string): Promise<KanbanBoard[]> {
    return this.boardService.findBoardsByWorkspaceId(workspaceId);
  }

  @Get('board/:id')
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async findBoardById(@Param('id') id: string): Promise<KanbanBoard> {
    return this.boardService.findBoardById(id);
  }

  @Put('boards/:id')
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async updateBoard(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<KanbanBoard> {
    return this.boardService.updateBoard(id, updateBoardDto);
  }

  @Delete('boards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async deleteBoard(@Param('id') id: string): Promise<void> {
    return this.boardService.deleteBoard(id);
  }

  // -------------------- Board Columns --------------------

  @Get('boards/:boardId/columns')
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async getBoardColumns(@Param('boardId') boardId: string): Promise<KanbanColumn[]> {
    return this.boardService.getBoardColumns(boardId);
  }

  // -------------------- Move Work Item --------------------

  @Post('boards/:boardId/move-work-item')
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async moveWorkItem(
    @Param('boardId') boardId: string,
    @Body() moveWorkItemDto: MoveWorkItemDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.boardService.moveWorkItem(boardId, moveWorkItemDto, userId);
  }

  // -------------------- Reorder Cards in List --------------------

  @Put('boards/:boardId/columns/:columnId/reorder-cards')
  @UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
  async reorderCardsInList(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() body: { cardIds: string[] },
  ) {
    return this.boardService.reorderCardsInList(boardId, columnId, body.cardIds);
  }
}
