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
import { CreateColumnDto } from '../column/dto/create-column.dto';
import { UpdateColumnDto } from '../column/dto/update-column.dto';
import { MoveWorkItemDto } from './dto/move-work-item.dto';
//import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { WorkItem } from '../work-item/schemas/work-item.schema';

@Controller('board')
export class KanbanBoardController {
  workItemService: any;
  constructor(private readonly boardService: KanbanBoardService) {}

  // -------------------- Boards --------------------

  @Post('create')
  async createBoard(@Body() createBoardDto: CreateBoardDto): Promise<KanbanBoard> {
    return this.boardService.createBoard(createBoardDto);
  }

  @Get(':id')
  async findBoardById(@Param('id') id: string): Promise<KanbanBoard> {
    return this.boardService.findBoardById(id);
  }

  @Put(':id')
  async updateBoard(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<KanbanBoard> {
    return this.boardService.updateBoard(id, updateBoardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoard(@Param('id') id: string): Promise<void> {
    return this.boardService.deleteBoard(id);
  }
  // -------------------- Move Work Item --------------------

  // @Post(':boardId/move-work-item')
  // async moveWorkItem(@Param('boardId') boardId: string, @Body() moveWorkItemDto: MoveWorkItemDto) {
  //   return this.boardService.moveWorkItem(boardId, moveWorkItemDto);
  // }

  // -------------------- Reorder Cards in List --------------------

//   @Put(':boardId/columns/:columnId/reorder-cards')
//   async reorderCardsInList(
//     @Param('boardId') boardId: string,
//     @Param('columnId') columnId: string,
//     @Body() body: { cardIds: string[] },
//   ) {
//     return this.boardService.reorderCardsInList(boardId, columnId, body.cardIds);
//   }
}
