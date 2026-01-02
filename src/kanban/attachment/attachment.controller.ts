// src/kanban/attachment/attachment.controller.ts
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';

@Controller('kanban/files')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  // -------------------- Upload Attachment --------------------
  @Post()
  async uploadAttachment(@Body() dto: UploadAttachmentDto) {
    return this.attachmentService.uploadAttachment(dto);
  }

  // -------------------- Get All Attachments --------------------
  @Get()
  async getAllAttachments() {
    return this.attachmentService.getAllAttachments();
  }

  // -------------------- Get Attachment by ID --------------------
  @Get(':id')
  async getAttachmentById(@Param('id') id: string) {
    return this.attachmentService.getAttachmentById(id);
  }

  // -------------------- Delete Attachment --------------------
  @Delete(':id')
  async deleteAttachment(@Param('id') id: string) {
    return this.attachmentService.deleteAttachment(id);
  }
}
