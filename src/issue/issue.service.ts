import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue } from './schemas/issue.schema';

@Injectable()
export class IssueService {
  constructor(
    @InjectModel(Issue.name) private issueModel: Model<Issue>,
  ) {}

  create(data: any) {
    return this.issueModel.create(data);
  }

  getByProject(projectId: string) {
    return this.issueModel
      .find({ projectId })
      .populate('assignee reporter');
  }

  changeStatus(id: string, status: string) {
    return this.issueModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
  }

  assign(id: string, assignee: string) {
    return this.issueModel.findByIdAndUpdate(
      id,
      { assignee },
      { new: true },
    );
  }
}
