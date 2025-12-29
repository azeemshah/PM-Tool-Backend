import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  addComment(@Body() body: any) {
    return this.commentService.create(body);
  }

  @Get('issue/:issueId')
  getByIssue(@Param('issueId') issueId: string) {
    return this.commentService.getByIssue(issueId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentService.remove(id);
  }
}
