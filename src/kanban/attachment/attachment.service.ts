// src/kanban/attachment/attachment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import * as fs from 'fs';
import * as path from 'path';
import { WorkItem } from '../work-item/schemas/work-item.schema';
import { KanbanBoard } from '../board/schemas/kanban-board.schema';
import { Workspace } from '../../workspace/schemas/workspace.schema';
import { User } from '../../users/schemas/user.schema';
import { EmailService } from '../../email/email.service';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectModel(Attachment.name)
    private readonly attachmentModel: Model<AttachmentDocument>,
    @InjectModel(WorkItem.name)
    private readonly workItemModel: Model<WorkItem>,
    @InjectModel(KanbanBoard.name)
    private readonly boardModel: Model<KanbanBoard>,
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<Workspace>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
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

    const saved = await attachment.save();
    try {
      const item = await this.workItemModel.findById(dto.workItemId).exec();
      const board = item ? await this.boardModel.findById(item.board).exec() : null;
      const workspace = board ? await this.workspaceModel.findById(board.workspaceId).exec() : null;
      const actor = dto.userId
        ? await this.userModel.findById(dto.userId).select('firstName lastName email').exec()
        : null;
      const actorName = actor
        ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email
        : undefined;
      const ids = workspace
        ? [
            workspace.OwnedBy?.toString(),
            ...(workspace.members || []).map((m) => m.toString()),
          ].filter(Boolean)
        : [];
      const unique = Array.from(new Set(ids));
      const users = await this.userModel
        .find({ _id: { $in: unique } })
        .select('email firstName lastName')
        .exec();
      const recipients = users.map((u: any) => ({
        email: u.email,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || undefined,
      }));
      const subject = `Attachment added: ${item?.title || ''}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Attachment Added',
        title: item?.title || saved.fileName,
        actorName,
        details: `File: <strong>${saved.fileName}</strong>`,
      });
      await this.emailService.sendActivityEmail(recipients, subject, html);
    } catch (_) {}
    return saved;
  }

  // -------------------- Get Attachments by WorkItem ID --------------------
  async getAttachmentsByWorkItemId(workItemId: string): Promise<Attachment[]> {
    return this.attachmentModel
      .find({ workItem: new Types.ObjectId(workItemId) })
      .populate('userId')
      .exec();
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
    const doc = await this.attachmentModel.findById(id).exec();
    const result = await this.attachmentModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    try {
      const item = doc ? await this.workItemModel.findById(doc.workItem).exec() : null;
      const board = item ? await this.boardModel.findById(item.board).exec() : null;
      const workspace = board ? await this.workspaceModel.findById(board.workspaceId).exec() : null;
      const ids = workspace
        ? [
            workspace.OwnedBy?.toString(),
            ...(workspace.members || []).map((m) => m.toString()),
          ].filter(Boolean)
        : [];
      const users = await this.userModel
        .find({ _id: { $in: Array.from(new Set(ids)) } })
        .select('email firstName lastName')
        .exec();
      const recipients = users.map((u: any) => ({
        email: u.email,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || undefined,
      }));
      const subject = `Attachment removed: ${item?.title || ''}`;
      const html = this.emailService.buildActivityTemplate({
        action: 'Attachment Removed',
        title: item?.title || id,
        details: `File removed`,
      });
      await this.emailService.sendActivityEmail(recipients, subject, html);
    } catch (_) {}
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
