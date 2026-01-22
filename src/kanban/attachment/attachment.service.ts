// src/kanban/attachment/attachment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectModel(Attachment.name)
    private readonly attachmentModel: Model<AttachmentDocument>,
  ) {}

  // -------------------- Upload Attachment --------------------
  async uploadAttachment(dto: UploadAttachmentDto): Promise<Attachment> {
    const attachment = new this.attachmentModel({
      workItem: new Types.ObjectId(dto.workItemId),
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      description: dto.description,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
    });

    return attachment.save();
  }

  // -------------------- Get All Attachments --------------------
  async getAllAttachments(): Promise<Attachment[]> {
    return this.attachmentModel.find().populate('workItem').populate('userId').exec();
  }

  // -------------------- Get Attachment by ID --------------------
  async getAttachmentById(id: string): Promise<Attachment> {
    const attachment = await this.attachmentModel
      .findById(id)
      .populate('workItem')
      .populate('userId')
      .exec();

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return attachment;
  }

  // -------------------- Delete Attachment --------------------
  async deleteAttachment(id: string): Promise<{ message: string }> {
    const result = await this.attachmentModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return { message: 'Attachment deleted successfully' };
  }

  // -------------------- Delete Attachment by URL --------------------
  async deleteAttachmentByUrl(url: string): Promise<{ message: string }> {
    // Try exact match
    let doc = await this.attachmentModel.findOne({ fileUrl: url }).exec();
    // Try without leading /api/v1
    if (!doc && url.startsWith('/api/')) {
      const alt = url.replace(/^\/api\/v1/, '');
      doc = await this.attachmentModel.findOne({ fileUrl: alt }).exec();
    }
    // Try by filename suffix
    if (!doc) {
      const filename = (url || '').split('/').pop() || '';
      if (filename) {
        doc = await this.attachmentModel.findOne({ fileUrl: new RegExp(`${filename}$`) }).exec();
      }
    }
    if (!doc) throw new NotFoundException(`Attachment with URL not found`);
    await this.attachmentModel.deleteOne({ _id: doc._id }).exec();

    // Attempt to delete physical file if it exists
    try {
      const fileName = (doc.fileUrl || url).split('/').pop() || '';
      if (fileName) {
        const fullPath = path.join(process.cwd(), 'uploads', fileName);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (_) {
      // ignore file system errors
    }

    return { message: 'Attachment deleted successfully' };
  }
}
