import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attachment } from './schemas/attachment.schema';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectModel(Attachment.name)
    private attachmentModel: Model<Attachment>,
  ) {}

  create(data: any) {
    return this.attachmentModel.create(data);
  }

  getByIssue(issueId: string) {
    return this.attachmentModel.find({ issueId });
  }

  remove(id: string) {
    return this.attachmentModel.findByIdAndDelete(id);
  }
}
