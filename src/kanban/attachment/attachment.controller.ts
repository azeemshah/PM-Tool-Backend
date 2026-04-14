// src/kanban/attachment/attachment.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pm-kanban/files')
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  // -------------------- Upload Attachment --------------------
  @Post()
  async uploadAttachment(@Body() dto: UploadAttachmentDto, @CurrentUser('userId') userId?: string) {
    const payload = { ...dto, userId: dto.userId || userId } as any;
    return this.attachmentService.uploadAttachment(payload);
  }

  // -------------------- Get Attachments by WorkItem ID --------------------
  @Get('work-item/:workItemId')
  async getAttachmentsByWorkItemId(@Param('workItemId') workItemId: string) {
    return this.attachmentService.getAttachmentsByWorkItemId(workItemId);
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

  // -------------------- Delete Attachment by URL (static route prioritized) --------------------
  @Delete('by-url')
  async deleteByUrl(@Query('url') url: string) {
    return this.attachmentService.deleteAttachmentByUrl(url);
  }

  // -------------------- Delete Attachment by ID --------------------
  @Delete(':id')
  async deleteAttachment(@Param('id') id: string) {
    return this.attachmentService.deleteAttachment(id);
  }

  // -------------------- Upload binary file and register attachment --------------------
  @Post('upload/:workItemId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const original = file.originalname.replace(/\s+/g, '_');
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${original}`;
          cb(null, unique);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadBinary(
    @Param('workItemId') workItemId: string,
    @UploadedFile() file: any, // Express.Multer.File
    @CurrentUser('userId') userId?: string,
  ) {
    if (!file) {
      return { success: false, message: 'No file provided' };
    }

    const fileName = file.filename;
    const fileUrl = `/api/v1/kanban/files/download/${fileName}`;

    // Register attachment metadata
    await this.attachmentService.uploadAttachment({
      workItemId,
      fileName: file.originalname,
      fileUrl,
      description: undefined,
      userId,
    } as any);

    return { success: true, url: fileUrl, fileName: file.originalname };
  }

  // -------------------- Download/serve uploaded file --------------------
  @Get('download/:file')
  async download(@Param('file') file: string, @Res() res: Response) {
    const fullPath = path.join(process.cwd(), 'uploads', file);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
    }
    return res.sendFile(fullPath);
  }
}
