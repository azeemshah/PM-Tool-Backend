import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProjectRole } from './schemas/project-role.schema';

@Injectable()
export class ProjectRoleService {
  constructor(
    @InjectModel(ProjectRole.name)
    private projectRoleModel: Model<ProjectRole>,
  ) {}

  assignRole(data: any) {
    return this.projectRoleModel.create(data);
  }

  getByProject(projectId: string) {
    return this.projectRoleModel
      .find({ projectId })
      .populate('userId', 'name email');
  }

  remove(id: string) {
    return this.projectRoleModel.findByIdAndDelete(id);
  }
}
