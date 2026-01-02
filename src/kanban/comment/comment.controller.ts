// src/kanban/comment/comment.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('kanban/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // -------------------- Create Comment --------------------
  @Post()
  async createComment(@Body() dto: CreateCommentDto) {
    return this.commentService.createComment(dto);
  }

  // -------------------- Get All Comments --------------------
  @Get()
  async getAllComments() {
    return this.commentService.getAllComments();
  }

  // -------------------- Get Comment by ID --------------------
  @Get(':id')
  async getCommentById(@Param('id') id: string) {
    return this.commentService.getCommentById(id);
  }

  // -------------------- Delete Comment --------------------
  @Delete(':id')
  async deleteComment(@Param('id') id: string) {
    return this.commentService.deleteComment(id);
  }
}
