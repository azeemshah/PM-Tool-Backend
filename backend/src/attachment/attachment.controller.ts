import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { AttachmentService } from './attachment.service';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  upload(@Body() body: any) {
    return this.attachmentService.create(body);
  }

  @Get('issue/:issueId')
  getByIssue(@Param('issueId') issueId: string) {
    return this.attachmentService.getByIssue(issueId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attachmentService.remove(id);
  }
}
