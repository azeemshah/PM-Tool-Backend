import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { BoardService } from './board.service';

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) { }

  @Post()
  create(@Body() body: any) {
    return this.boardService.create(body);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.boardService.getByProject(projectId);
  }
}
