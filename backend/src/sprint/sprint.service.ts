import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sprint } from './schemas/sprint.schema';

@Injectable()
export class SprintService {
  constructor(
    @InjectModel(Sprint.name) private sprintModel: Model<Sprint>,
  ) {}

  create(data: any) {
    return this.sprintModel.create(data);
  }

  getByProject(projectId: string) {
    return this.sprintModel.find({ projectId });
  }

  updateStatus(id: string, status: string) {
    return this.sprintModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
  }
}
