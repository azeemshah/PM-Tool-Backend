import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workflow } from './schemas/workflow.schema';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private workflowModel: Model<Workflow>,
  ) {}

  create(data: any) {
    return this.workflowModel.create(data);
  }

  getByProject(projectId: string) {
    return this.workflowModel.find({ projectId });
  }

  update(id: string, data: any) {
    return this.workflowModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    );
  }
}
