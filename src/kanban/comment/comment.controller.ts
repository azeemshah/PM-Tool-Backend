// src/kanban/comment/comment.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('kanban/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  // -------------------- Create Comment --------------------
  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(@Body() dto: CreateCommentDto, @CurrentUser('userId') userId?: string) {
    return this.commentService.createComment(dto, userId);
  }

  // -------------------- Get All Comments --------------------
  @Get()
  async getAllComments() {
    return this.commentService.getAllComments();
  }

  // -------------------- Get Comments by Work Item --------------------
  @Get('work-item/:workItemId')
  async getCommentsByWorkItem(@Param('workItemId') workItemId: string) {
    return this.commentService.getCommentsByWorkItem(workItemId);
  }

  // -------------------- Get Comment by ID --------------------
  @Get(':id')
  async getCommentById(@Param('id') id: string) {
    return this.commentService.getCommentById(id);
  }

  // -------------------- Update Comment --------------------
  @Put(':id')
  async updateComment(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.commentService.updateComment(id, dto);
  }

  // -------------------- Delete Comment --------------------

  // -------------------- Delete Comment --------------------
  @Delete(':id')
  async deleteComment(@Param('id') id: string) {
    return this.commentService.deleteComment(id);
  }
}
