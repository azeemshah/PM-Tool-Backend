// src/kanban/attachment/attachment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';

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
}
